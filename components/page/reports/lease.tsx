import React, {useEffect, useState} from 'react';
import { fMoneyformat, useIncomeExpensesContext } from '../../states/PaymentExpenseState';
import { MonthRange } from './monthRange';
import { getPaymentsByMonthAddress, getMaintenanceData, IAmountAndPmtRecords } from './reportUtil';
import moment from 'moment';
//import {saveToGS} from './utils/updateGS';
import { GetInfoDialogHelper } from '../../generic/basedialog'
import { ILeaseInfo, IPayment } from '../../reportTypes';
import { getLeases} from '../../api'
import { keyBy, orderBy, sortBy } from 'lodash';
import { getLeaseUtilForHouse, ILeaseInfoWithPmtInfo } from '../../utils/leaseUtil';


//old, moved toautoAssignLeases
export function LeaseReport() {
    const ctx = useIncomeExpensesContext();
    
    
    type ILeaseInfoWithPmtInfoWithHouseId = ILeaseInfoWithPmtInfo & ILeaseInfo;
    const [leases, setLeases] = useState<ILeaseInfoWithPmtInfoWithHouseId[]>([]);

    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});
    const monthlyDueDate = 3;
    useEffect(() => {
        getLeases().then(async lss => {
            const all: ILeaseInfoWithPmtInfoWithHouseId[] = [];
            for (const ls of orderBy(lss, ls=>ls.startDate, 'desc')) {
                const lt = await getLeaseUtilForHouse(ls.houseID);   
                const pmts = await lt.loadLeasePayments(ls);
                const r: ILeaseInfoWithPmtInfo = lt.calculateLeaseBalances(ls, pmts, monthlyDueDate, new Date());
                all.push({                    
                    ...r,
                    ...ls,
                });
            }            
            setLeases(all);            
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
                                                                <tr><td colSpan={2}>{lease.totalPayments}</td><td colSpan={2}>{lease.totalBalance}</td></tr>
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