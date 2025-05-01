import { orderBy } from 'lodash';
import * as api from '../api'
import moment from 'moment';
import { IHouseInfo, ILeaseInfo, IPayment } from '../reportTypes';
import { round2 } from '../report/util/utils';

export type HouseWithLease = IHouseInfo & {
    lease?: ILeaseInfo;
    leaseInfo?: ILeaseInfoWithPmtInfo;
}

interface IPaymentOfMonth {
    paid: number;
    shouldAccumatled: number;
    accumulated: number;
    month: string;
    balance: number;
}

//Same as IPayment but only needed items
type IPaymentForLease = {
    receivedAmount: number;
    houseID: string;
    receivedDate: string;
    paymentTypeName: string;
}

export interface ILeaseInfoWithPmtInfo {
    totalPayments: number;
    totalBalance: number;
    payments: IPaymentForLease[];
    monthlyInfo: IPaymentOfMonth[];
    lastPaymentDate: string;
    lastPaymentAmount: number;
}

export async function getLeaseUtilForHouse(houseID: string) {
    const allLeases = orderBy(await api.getLeases({
        whereArray: [{
            field: 'houseID',
            op: '=',
            val: houseID,
        }]
    }), r => r.startDate, 'desc');


    function findLeaseForDate(date: string | Date | moment.Moment): ILeaseInfo {
        const pd = moment.utc(date);
        for (const l of allLeases) {
            if (moment.utc(l.startDate).isBefore(pd)) {
                return l;
            }
        }
        return null;
    }
    async function matchAllTransactions() {
        const unleasedPayments = await api.getPaymnents({
            whereArray: [
                {
                    field: 'leaseID',
                    op: 'isNULL',
                    val: null,
                },
                {
                    field: 'houseID',
                    op: '=',
                    val: houseID,
                }
            ]
        });
    
        unleasedPayments.forEach(p => {
            const l = findLeaseForDate(p.receivedDate);
            if (l) {
                p.leaseID = l.leaseID;
            }
        });
        return unleasedPayments;
    }


    function calculateLeaseBalances(l: ILeaseInfo, payments: IPaymentForLease[], monthlyDueDate: number, today: string | Date | moment.Moment) {        
        const monthlyInfo: IPaymentOfMonth[] = [];
        const now = moment.utc(today);
        const dueDate = now.clone().startOf('month').add(monthlyDueDate, 'days');
        let curMon = moment.utc(l.startDate);
        let shouldAccumatled = 0;
        const lastDueMonth = now.isAfter(dueDate) ? now : now.clone().add(-1, 'month').startOf('month');
        const monthInfoLookup: { [mon: string]: IPaymentOfMonth } = {};
        const YYYYMMFormat = 'YYYY-MM';
        //const firstMonthStr = curMon.format(YYYYMMFormat);
        let finalMonthStr = '';  //lastDueMonth.format(YYYYMMFormat);
        //const terminationDate = l.terminationDate ? moment(l.terminationDate) : null;
        while (curMon.isSameOrBefore(lastDueMonth)) {
            const month = curMon.format(YYYYMMFormat);
            const checkTerminated = (str: string) => str && curMon.isSameOrBefore(moment(str));
            const checkEnded = (str: string) => str && curMon.isAfter(moment(str));
            const isTerminated = checkTerminated(l.terminationDate);
            const ended = checkEnded(l.endDate);
            
            if (isTerminated || ended) {
                break;
            }
            shouldAccumatled = round2(shouldAccumatled + l.monthlyRent);
            
            const info: IPaymentOfMonth = {
                month,
                accumulated: 0,
                shouldAccumatled,
                paid: 0,
                balance: 0,
            }
            monthInfoLookup[month] = info;
            finalMonthStr = month;
            monthlyInfo.push(info);
            curMon = curMon.add(1, 'month');
        }
        const lps = orderBy(payments.filter(p => p.houseID === l.houseID).map(p => {
            return {
                ...p,
                receivedDate: moment.utc(p.receivedDate).format('YYYY-MM-DD HH:mm:ss'),  //TODO change this to db date utc
            }
        }), p => p.receivedDate, 'asc');
        function strToNum(str: string) {
            return parseInt(str.replace(/\D/g,''));
        }
        const result: ILeaseInfoWithPmtInfo = lps.reduce((acc, pmt) => {
            if (pmt.paymentTypeName !== 'Rent') return acc;
            if (moment(pmt.receivedDate).isBefore(moment(l.startDate))) return acc;
            const paymentMonth = pmt.receivedDate.substring(0, 7);
            if (finalMonthStr && strToNum(paymentMonth) <= strToNum(finalMonthStr)) { //issue with firefox
                if (!acc.lastPaymentAmount || moment(pmt.receivedDate).isAfter(acc.lastPaymentDate)) {
                    acc.lastPaymentDate = pmt.receivedDate;
                    acc.lastPaymentAmount = pmt.receivedAmount;
                }
                acc.totalPayments = round2(acc.totalPayments + pmt.receivedAmount);
                acc.payments.push(pmt);
                const info = monthInfoLookup[paymentMonth]; // || monthInfoLookup[firstMonthStr];
                if (!info) {
                    console.log('Cant find info for ', paymentMonth, monthInfoLookup, 'finalMonthStr', finalMonthStr, 'patyMtntmonth', paymentMonth, strToNum(paymentMonth), 'strToNum(finalMonthStr)', strToNum(finalMonthStr))
                }
                info.paid = round2(info.paid + pmt.receivedAmount);                
                info.accumulated = acc.totalPayments;
                info.balance = round2(info.shouldAccumatled - info.accumulated);
                acc.totalBalance = round2(info.shouldAccumatled - info.accumulated);
                console.log(`lookuping up with ${pmt.receivedDate.substring(0, 7)} paid=${info.paid} accumulated=${info.accumulated} balance=${info.balance}`)
            }
            return acc;
        }, {
            totalPayments: 0,
            totalBalance: 0,
            payments: [],
            monthlyInfo,
            lastPaymentDate: '',
            lastPaymentAmount: 0,
        });
        result.monthlyInfo.reduce((acc, mon) => {            
            if (!mon.accumulated) mon.accumulated = acc.last.accumulated;
            const balance = round2(mon.shouldAccumatled - mon.accumulated);
            if (mon.balance == 0) mon.balance = balance;
            if (balance !== mon.balance) {
                console.log(`Error!!!! should not have a different balance ${balance} ${mon.balance}`);
            }
            result.totalBalance = balance;
            acc.last = mon;
            return acc;
        }, {
            last: result.monthlyInfo[0]
        });
        return result;
    }

    return {
        allLeases,
        findLeaseForDate,
        matchAllTransactions,
        calculateLeaseBalances,
        loadLeasePayments: (lease: ILeaseInfo) => {
            return api.getPaymnents({
                whereArray: [
                    {
                        field: 'leaseID',
                        op: '=',
                        val: lease.leaseID,
                    }
                ]
            });
        }, 
        matchAndAddLeaseToTransactions: async (onProgress: (pos: number, pmt?: IPayment) => void) => {
            const all = await matchAllTransactions();
            onProgress(all.length);
            let pos = 0;
            for (const t of all) {
                if (t.leaseID) {
                    onProgress(pos, t);
                    await api.sqlAdd('rentPaymentInfo', t as any, false);
                }
                pos++;
            }
            return all;
        }
    }
}


export async function gatherLeaseInfomation(house: HouseWithLease, date?: Date) {
    const finder = await getLeaseUtilForHouse(house.houseID);
    const lease = await finder.findLeaseForDate(date || new Date());

    if (!lease) {
        return 'Lease not found';
    }
    const payments = await finder.loadLeasePayments(lease);
    const leaseBalance = finder.calculateLeaseBalances(lease, payments, 5, new Date());

    leaseBalance.monthlyInfo.reverse();
    house.lease = lease;
    house.leaseInfo = leaseBalance;
    return {
        lease,
        leaseBalance,
    };
}

export async function getAllPaymentForHouse(houseID: string) {
    const allPayments = await api.getPaymnents({
        whereArray: [
            {
                field: 'houseID',
                op: '=',
                val: houseID,
            }
        ]
    });
    return allPayments;
}


export async function getAllMaintenanceForHouse(houseID: string) {
    const allPayments = await api.getMaintenance({
        whereArray: [
            {
                field: 'houseID',
                op: '=',
                val: houseID,
            }
        ]
    });
    return allPayments;
}