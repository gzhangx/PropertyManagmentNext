import { orderBy } from 'lodash';
import * as api from '../api'
import moment from 'moment';
import { IHouseInfo, ILeaseInfo, IPayment } from '../reportTypes';
import { round2 } from '../report/util/utils';
import { filterPaymentsForRent } from './reportUtils';

export type HouseWithLease = IHouseInfo & {
    lease?: ILeaseInfo;
    leaseInfo?: ILeaseInfoWithPmtInfo;
    leaseBalanceDueInfo?: ILeaseInfoWithPaymentDueHistory;
}

export interface INewLeaseBalance {
    paymentOrDueAmount: number;
    paymentOrDueTransactionType: 'Payment' | 'Due';
    date: string;
    previousBalance?: number;
    newBalance: number; //current balance before payment is applied
}

export interface ILeaseInfoWithPaymentDueHistory {    
    totalBalance: number;    
    paymnetDuesInfo: INewLeaseBalance[];
    lastPaymentDate: string;
    lastPaymentAmount: number;

    monthlyRent: number;

    balanceForwarded: number;

    getLastNMonth: (n: number) => INewLeaseBalance[];

    totalPaid: number; //debug
    lastNPaymentAndDue: INewLeaseBalance[];
}

//old
interface IPaymentOfMonth {
    paid: number;
    paymentDate: string;
    dueDate: string;
    shouldAccumatled: number;
    accumulated: number;
    month: string;
    balance: number;
    previousBalance: number;
}

//Same as IPayment but only needed items
type IPaymentForLease = {
    receivedAmount: number;
    houseID: string;
    receivedDate: string;
    paymentTypeName: string;
}

//old
export interface ILeaseInfoWithPmtInfo {
    totalPayments: number;
    totalBalance: number;
    payments: IPaymentForLease[];
    monthlyInfo: IPaymentOfMonth[];
    lastPaymentDate: string;
    lastPaymentAmount: number;

    monthlyRent: number;
}

export async function getLeaseUtilForHouse(houseID: string) {
    const allLeases = orderBy(await api.getLeases({
        whereArray: [{
            field: 'houseID',
            op: '=',
            val: houseID,
        }]
    }), r => r.startDate, 'desc');


    function findLeaseForDate(date: string | Date | moment.Moment): ILeaseInfo | null {
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
    
        if (unleasedPayments) {
            unleasedPayments.forEach(p => {
                const l = findLeaseForDate(p.receivedDate);
                if (l) {
                    p.leaseID = l.leaseID;
                }
            });
        }
        return unleasedPayments;
    }

    //old dont use
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
            const checkTerminated = (str: string | null | undefined) => str && curMon.isSameOrBefore(moment(str));
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
                previousBalance: 0,

                dueDate: moment(curMon).clone().startOf('month').add(monthlyDueDate, 'days').format('YYYY-MM-DD'),
                paymentDate: '',
            }
            monthInfoLookup[month] = info;
            finalMonthStr = month;
            monthlyInfo.push(info);
            curMon = curMon.add(1, 'month');
        }
        const lps = orderBy(payments.filter(p => p.houseID === l.houseID && filterPaymentsForRent(p)).map(p => {
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

                info.paymentDate = pmt.receivedDate;
                //console.log(`lookuping up with ${pmt.receivedDate.substring(0, 7)} paid=${info.paid} accumulated=${info.accumulated} balance=${info.balance}`)
            }
            return acc;
        }, {
            totalPayments: 0,
            totalBalance: 0,
            payments: [] as IPaymentForLease[],
            monthlyInfo,
            lastPaymentDate: '',
            lastPaymentAmount: 0,
            monthlyRent: l.monthlyRent,
        });
        result.monthlyInfo.reduce((acc, mon) => {            
            if (!mon.accumulated) mon.accumulated = acc.last.accumulated;
            mon.previousBalance = mon.shouldAccumatled - acc.last.accumulated;            
            const balance = round2(mon.shouldAccumatled - mon.accumulated);
            if (mon.balance == 0) mon.balance = balance;
            if (balance !== mon.balance) {
                console.log(`Error!!!! should not have a different balance ${balance} ${mon.balance}`);
            }
            result.totalBalance = balance;
            acc.last = mon;
            return acc;
        }, {
            //last: result.monthlyInfo[0]
            last: {
                accumulated: 0,
            }
        });
        return result;
    }

    const loadLeasePayments = (lease: ILeaseInfo) => {
        return api.getPaymnents({
            whereArray: [
                {
                    field: 'leaseID',
                    op: '=',
                    val: lease.leaseID,
                }
            ]
        });
    };

    return {
        allLeases,
        findLeaseForDate,
        matchAllTransactions,
        calculateLeaseBalances,
        calculateLeaseBalancesNew, //new one to replace calculateLeaseBalance
        loadLeasePayments, 
        loadAllLeaesAndPayments: async (lease: ILeaseInfo) => {            
            const allleasesWithTenant = await api.getLeases({
                whereArray: [
                    {
                        field: 'tenant1',
                        op: '=',
                        val: lease.tenant1,
                    }
                ]
            });            
            const leaseAndPayments: {
                lease: ILeaseInfo;
                payments: IPayment[];
            }[] = [];
            for (const l of allleasesWithTenant) {                
                const pmts = await loadLeasePayments(l);                
                if (pmts) {          
                    leaseAndPayments.push({
                        lease: l,
                        payments: pmts,
                    })
                }
            }
            
            return orderBy(leaseAndPayments, l => l.lease.startDate, 'asc');
        },
        matchAndAddLeaseToTransactions: async (onProgress: (pos: number, pmt?: IPayment) => void) => {
            const all = await matchAllTransactions();
            if (!all) return all;
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


export async function gatherLeaseInfomation(house: HouseWithLease, fixAllLeases: boolean = true,  date?: Date) {
    const finder = await getLeaseUtilForHouse(house.houseID);
    const lease = await finder.findLeaseForDate(date || new Date());

    if (!lease) {
        return 'Lease not found';
    }
    
    let previousBalance = 0;
    const allLeaseAndLeaseBalanceDueInfos: {
        lease: ILeaseInfo;
        leaseBalanceDueInfo: ILeaseInfoWithPaymentDueHistory;
    }[] = [];
    if (fixAllLeases) {
        const leasesAndPayments = await finder.loadAllLeaesAndPayments(lease);
        for (const lp of leasesAndPayments) {
            const leaseBalanceDueInfo = finder.calculateLeaseBalancesNew(lp.payments, previousBalance, lp.lease, new Date());                        
            previousBalance = leaseBalanceDueInfo.totalBalance;
            allLeaseAndLeaseBalanceDueInfos.push({
                lease: lp.lease,
                leaseBalanceDueInfo,
            })
        }
    }
    const payments = await finder.loadLeasePayments(lease);
    const leaseBalance = finder.calculateLeaseBalances(lease, payments || [], 5, new Date());
    //const leaseBalanceDueInfo = finder.calculateLeaseBalancesNew(payments || [], previousBalance, lease, new Date());

    leaseBalance.monthlyInfo.reverse();
    house.lease = lease;
    house.leaseInfo = leaseBalance;
    const leaseBalanceDueInfo = allLeaseAndLeaseBalanceDueInfos.find(l => l.lease.leaseID === lease.leaseID)?.leaseBalanceDueInfo;
    house.leaseBalanceDueInfo = leaseBalanceDueInfo;
    return {
        lease,
        leaseBalance,
        leaseBalanceDueInfo,
        allLeaseAndLeaseBalanceDueInfos,
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



function calculateLeaseBalancesNew(
    payments: IPaymentForLease[],
    previousBalanceFromPreviousLease: number,
    lease: ILeaseInfo,
    endDateOverride?: string | Date | moment.Moment
): ILeaseInfoWithPaymentDueHistory {    
    // Determine the effective end date (override takes precedence, then termination, then lease end)
    // Collect all potential end dates (excluding null values)
    const potentialEndDates: moment.Moment[] = [];
    function extendEndDate(endDay: string | Date | moment.Moment) {
        return moment(endDay).add(1, 'days').startOf('day').subtract(1, 'second');
    }

    if (lease.endDate) potentialEndDates.push(extendEndDate(lease.endDate));
    if (lease.terminationDate) potentialEndDates.push(extendEndDate(lease.terminationDate));
    if (endDateOverride) potentialEndDates.push(extendEndDate(endDateOverride));

    // Determine effective end date - earliest of provided dates or today if none
    const effectiveEndDate = potentialEndDates.length > 0
        ? moment.min(potentialEndDates)
        : moment(); // Default to today if no end dates provided

    // 1. Generate all rent due dates between lease start and effective end date
    const rentDueDates: INewLeaseBalance[] = [];
    const startDate = moment(lease.startDate);

    if (previousBalanceFromPreviousLease) {
        rentDueDates.push({
            date: startDate.format('YYYY-MM-DD'),            
            paymentOrDueAmount: previousBalanceFromPreviousLease,
            paymentOrDueTransactionType: 'Due',
            previousBalance: 0, // Will be updated later
            newBalance: 0       // Will be updated later
        })
    }
    payments = payments.filter(p => {
        if (p.houseID !== lease.houseID) return false;
        if (!filterPaymentsForRent(p)) return false;
        const pm = moment(p.receivedDate);
        if (pm.isBefore(startDate)) return false;
        if (pm.isAfter(effectiveEndDate)) return false;
        return true;
    })

    // Calculate first rent due date
    let currentDueDate = moment(startDate);
    let isFirstMonth = true;
    if (startDate.date() > lease.rentDueDay) {
        // If lease started after due day, first rent is due next month
        isFirstMonth = false;
        rentDueDates.push({
            paymentOrDueAmount: lease.firstMonthProratedRent || 0, // lease.monthlyRent,
            paymentOrDueTransactionType: 'Due',
            date: currentDueDate.format('YYYY-MM-DD'),
            previousBalance: 0, // Will be updated later
            newBalance: 0       // Will be updated later
        });
        currentDueDate.add(1, 'month');
    }
    currentDueDate.date(lease.rentDueDay);

    // Generate all due dates until effective end date
    while (currentDueDate.isSameOrBefore(effectiveEndDate)) {
        let rentDue = lease.monthlyRent;
        if (isFirstMonth && startDate.date() > 1) {
            if (lease.firstMonthProratedRent || lease.firstMonthProratedRent === 0) {
                rentDue = lease.firstMonthProratedRent || 0;
            } 
        }        
        rentDueDates.push({
            paymentOrDueAmount: rentDue,
            paymentOrDueTransactionType: 'Due',
            date: currentDueDate.format('YYYY-MM-DD'),
            previousBalance: 0, // Will be updated later
            newBalance: 0       // Will be updated later
        });
        // Move to next month
        currentDueDate = moment(currentDueDate).add(1, 'month');
        isFirstMonth = false;
    }

    // Create payment transactions
    const paymentTransactions: INewLeaseBalance[] = payments.map(payment => ({
        paymentOrDueAmount: payment.receivedAmount,
        paymentOrDueTransactionType: 'Payment',
        date: payment.receivedDate,
        previousBalance: 0, // Will be updated later
        newBalance: 0       // Will be updated later
    }));

    // Combine and sort all transactions by date
    const allTransactions: INewLeaseBalance[] = [...rentDueDates, ...paymentTransactions];
    allTransactions.sort((a, b) => {
        const dateDiff = moment(a.date).diff(moment(b.date));
        // If dates are equal, process Due before Payment
        if (dateDiff === 0) {
            return a.paymentOrDueTransactionType === 'Due' ? -1 : 1;
        }
        return dateDiff;
    });

    const paymnetDuesInfo: INewLeaseBalance[] = [];
    // Calculate balances in chronological order
    let balance = 0;
    for (const transaction of allTransactions) {
        const previousBalance = balance;

        if (transaction.paymentOrDueTransactionType === 'Due') {
            balance = round2(balance + transaction.paymentOrDueAmount);
        } else {
            balance = round2(balance - transaction.paymentOrDueAmount);
        }

        paymnetDuesInfo.push({
            ...transaction,
            previousBalance,
            newBalance: balance
        });
    }

    //return result;
    

    const paymentDuesAndBalanceInfo: ILeaseInfoWithPaymentDueHistory = {
        lastPaymentAmount: 0,
        lastPaymentDate: '',
        monthlyRent: lease.monthlyRent,
        paymnetDuesInfo,
        totalBalance: 0,

        balanceForwarded: 0,
        totalPaid: 0, //debug
        getLastNMonth: null as any,
        lastNPaymentAndDue: null as any,
    };

    paymentDuesAndBalanceInfo.getLastNMonth = (n) => {
        const lastn: INewLeaseBalance[] = [];
        //return paymnetDuesInfo;
        let cnt = 0;
        for (let pos = paymnetDuesInfo.length - 1; pos >= 0; pos--) {
            const objAtPos = paymnetDuesInfo[pos];
            if (!objAtPos) break;
            paymentDuesAndBalanceInfo.balanceForwarded = objAtPos.previousBalance || 0;            
            lastn.push(objAtPos);
            if (objAtPos.paymentOrDueTransactionType === 'Due') {
                cnt++;
                if (cnt === n) break;
            }
        }
        const reversed = lastn.reverse();
        return reversed;
    }

    paymentDuesAndBalanceInfo.lastNPaymentAndDue = paymentDuesAndBalanceInfo.getLastNMonth(3); //default to 3.  This is needed as balance forward is setup here here

    for (const pdi of paymnetDuesInfo) {
        if (pdi.paymentOrDueTransactionType === 'Payment') {
            paymentDuesAndBalanceInfo.lastPaymentAmount = pdi.paymentOrDueAmount;
            paymentDuesAndBalanceInfo.lastPaymentDate = pdi.date;
            paymentDuesAndBalanceInfo.totalPaid = round2(paymentDuesAndBalanceInfo.totalPaid + pdi.paymentOrDueAmount);
        }
        paymentDuesAndBalanceInfo.totalBalance = pdi.newBalance;
    }

    return paymentDuesAndBalanceInfo
}



//find all leases and check if those leases are bad
export async function fixBadLeaseIds() {

    const counts = await api.getPaymnents({
        fields: ['leaseID', { op: 'count', field: 'leaseID', name: 'countOfThisLease' }],
        groupByArray: [{
            field: 'leaseID'
        }]
    }) as unknown as {
        leaseID: string;
        countOfThisLease: number;
    }[];
    console.log('counts', counts);
    const badLeases = [];
    for (const cnt of counts) {
        if (!cnt.leaseID) continue;
        const lease = await api.getLeases({
            fields: ['leaseID','startDate', 'houseID', 'tenant1'],
            whereArray: [
                { field: 'leaseID', op: '=', val: cnt.leaseID }
            ]
        });
        if (lease.length === 0) {
            console.log('debugremove lease', lease)
            badLeases.push(cnt);
        }
    }
    return badLeases;
}

export async function clearLeaseIds(houseID: string) {
    const allPayments = await api.getPaymnents({
        whereArray: [
            {
                field: 'houseID',
                op: '=',
                val: houseID,
            }
        ]
    });
    if (!allPayments) return 0;
    const paymentsToUpdate = allPayments.filter(p => p.leaseID);
    for (const p of paymentsToUpdate) {
        p.leaseID = null;
        await api.sqlAdd('rentPaymentInfo', p as any, false, true);
    }
    return paymentsToUpdate.length;

}