import React, {useEffect, useState} from 'react';
import { fMoneyformat, useIncomeExpensesContext } from '../../states/PaymentExpenseState';
import { MonthRange } from './monthRange';
import { getPaymentsByMonthAddress, getMaintenanceData, IAmountAndPmtRecords } from './reportUtil';
import moment from 'moment';
//import {saveToGS} from './utils/updateGS';
import { GetInfoDialogHelper } from '../../generic/basedialog'
import { ILeaseInfo, IPayment } from '../../reportTypes';
import { getLeases} from '../../api'
import { keyBy, sortBy } from 'lodash';


//old, moved toautoAssignLeases
export function LeaseReport(props) {
    const ctx = useIncomeExpensesContext();
    const { payments, rawExpenseData, selectedHouses, monthes, paymentCalcOpts } = ctx;
    
    const monAddr = getPaymentsByMonthAddress(payments, paymentCalcOpts);

    const calculatedMaintData = getMaintenanceData(rawExpenseData, paymentCalcOpts);    
    
    interface IPaymentOfMonth {
        paid: number;
        shouldAccumatled: number;
        accumulated: number;
        month: string;
    }
    interface ILeaseInfoWithPmtInfo extends ILeaseInfo {
        totalPayments: number;
        totalMissing: number;
        payments: IPayment[];
        monthlyInfo: IPaymentOfMonth[];
    }
    const [leases, setLeases] = useState<ILeaseInfoWithPmtInfo[]>([]);

    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});
    const monthlyDueDate = 3;
    useEffect(() => {
        getLeases().then(ls => {
            setLeases(ls.map(l => {
                const monthlyInfo: IPaymentOfMonth[] = [];
                const now = moment();
                const dueDate = now.startOf('month').add(monthlyDueDate, 'days');
                let curMon = moment(l.startDate);
                let shouldAccumatled = 0;
                const lastDueMonth = now.isAfter(dueDate) ? now : now.add(-1, 'month').startOf('month');
                const monthInfoLookup: { [mon: string]: IPaymentOfMonth } = {};
                while (curMon.isSameOrBefore(lastDueMonth)) {
                    const month = curMon.format('YYYY-MM');
                    shouldAccumatled += l.monthlyRent;
                    const info = {
                        month,
                        accumulated: 0,
                        shouldAccumatled,
                        paid: 0,
                    }
                    monthInfoLookup[month] = info;
                    monthlyInfo.push(info);
                    curMon = curMon.add(1, 'month');
                }
                const lps = payments.filter(p => p.houseID === l.houseID).map(p => {
                    return {
                        ...p,
                        receivedDate: moment(p.receivedDate).format('YYYY-MM-DD'),
                    }
                }).filter(p => p.receivedDate >= l.startDate);
                const result: ILeaseInfoWithPmtInfo = lps.reduce((acc, pmt) => {
                    acc.totalPayments = acc.totalPayments + pmt.receivedAmount;
                    acc.payments.push(pmt);
                    console.log(`lookuping up with ${pmt.receivedDate.substring(0, 7)}`)
                    const info = monthInfoLookup[pmt.receivedDate.substring(0, 7)];
                    if (info) {
                        info.paid += pmt.receivedAmount;
                    }
                    return acc;
                }, {
                    ...l,
                    totalPayments: 0,
                    totalMissing: 0,
                    payments: [],
                    monthlyInfo,
                });
                result.monthlyInfo.reduce((acc, info) => {
                    acc.total += info.paid;
                    info.accumulated = acc.total;
                    result.totalMissing = info.shouldAccumatled - info.accumulated;
                    return acc;
                }, {
                    total: 0,
                });
                return result;
            }));
        })
    }, [ctx.googleSheetAuthInfo.googleSheetId]);
    
    const leaseFields = [
        {
            field: 'houseID',
            desc: 'House'
        },
        {
            field: 'startDate',
            desc: 'Start Date'
        },
        {
            field: 'endDate',
            desc: 'End Date'
        },
        {
            field: 'monthlyRent',
            desc: 'Amount'
        },
    ]

    const houseById = keyBy(ctx.allHouses, h => h.houseID)
    return <div>
        
        <div className="modal-body">
            <div className='row'>
                <MonthRange jjctx={{
                    allMonthes: ctx.allMonthes,
                    allHouses: ctx.allHouses,
                    setCurMonthSelection: ctx.setCurMonthSelection, //type IEditTextDropdownItem
                    selectedMonths: ctx.selectedMonths, setSelectedMonths: ctx.setSelectedMonths,
                    selectedHouses: ctx.selectedHouses, setSelectedHouses: ctx.setSelectedHouses,
                }}></MonthRange>
            </div>
            <div className='row'>
                <table className='table'>
                    <thead>
                        <tr>
                            {
                                leaseFields.map((mon, key) => {
                                    return <th className='tdColumnHeader' key={key}>{mon.desc}</th>
                                })
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            leases.map((lease, key) => {
                                return <><tr key={key}>
                                    {
                                        leaseFields.map((lf, key) => {
                                            if (lf.field === 'houseID') {
                                                const house = houseById[lease.houseID];
                                                let h = lease.houseID;
                                                if (house) h = house.address;
                                                return <td> <button className='btn btn-primary' onClick={() => {
                                                    setLeaseExpanded(state => {
                                                        return {
                                                            ...state,
                                                            [lease.leaseID]: !state[lease.leaseID]
                                                        }
                                                    })
                                                }}>{h}</button></td>
                                            }
                                            return < td key={key} className='tdCenter' > {
                                                lease[lf.field]
                                            }</td>
                                        })
                                    }
                                </tr>
                                    {
                                        leaseExpanded[lease.leaseID] && <tr>
                                            <td colSpan={4}>
                                                <div className="card shadow mb-4">
                                                    <div className="card-header py-3">
                                                        <h6 className="m-0 font-weight-bold text-primary">Details</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <table className='table'>
                                                            <tbody>
                                                            <tr><td colSpan={2}> lease.totalPayments</td><td colSpan={2}> lease.totalMissing</td></tr>
                                                                <tr><td colSpan={2}>{lease.totalPayments}</td><td colSpan={2}>{lease.totalMissing}</td></tr>
                                                                <tr><td>month</td><td>Paid</td><td>Accumulated</td><td>Should Accumlated</td></tr>
                                                                {
                                                                    lease.monthlyInfo.map(info => {
                                                                        return <tr><td>{ info.month}</td><td>{ info.paid}</td><td>{ info.accumulated}</td><td>{ info.shouldAccumatled}</td></tr>
                                                                    })
                                                                }
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                </>
                            })
                        }
                                        
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}