import React, {useEffect, useState} from 'react';
import { fMoneyformat, useIncomeExpensesContext } from '../../states/PaymentExpenseState';
import { MonthRange } from './monthRange';
import { getPaymentsByMonthAddress, getMaintenanceData, IAmountAndPmtRecords } from './reportUtil';
import moment from 'moment';
//import {saveToGS} from './utils/updateGS';
import { GetInfoDialogHelper } from '../../generic/basedialog'
import { ILeaseInfo } from '../../reportTypes';
import { getLeases} from '../../api'
import { keyBy } from 'lodash';

export function LeaseReport(props) {
    const ctx = useIncomeExpensesContext();
    const { payments, rawExpenseData, selectedHouses, monthes, paymentCalcOpts } = ctx;
    
    const monAddr = getPaymentsByMonthAddress(payments, paymentCalcOpts);

    const calculatedMaintData = getMaintenanceData(rawExpenseData, paymentCalcOpts);
    const [showDetail, setShowDetail] = useState(null);
    
    const [leases, setLeases] = useState<ILeaseInfo[]>([]);

    useEffect(() => {
        getLeases(ctx.selectedOwners).then(ls => {
            setLeases(ls);
        })
    },[ctx.selectedOwners]);
    
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
            field: 'endDate',
            desc: 'End Date'
        },
    ]

    const houseById = keyBy(ctx.allHouses, h=>h.houseID)
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
                            leases.filter(h => (selectedHouses[h.houseID])).map((lease, key) => {
                                return <tr key={key}>                                    
                                    {
                                        leaseFields.map((lf, key) => {
                                            if (lf.field === 'houseID') {
                                                return <td>{ houseById[lease.houseID].address}</td>
                                            }
                                            return < td key={key} className='tdCenter' > {
                                                lease[lf.field]
                                            }</td>
                                        })
                                    }
                                </tr>
                            })
                        }                    
                                        
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}