
import React, { useState, useEffect } from 'react';
import { sqlGet } from '../../components/api';
import { IMaintenanceDataResponse, IWorkerCompResponse, IWorkerInfoShort } from '../../components/reportTypes'
import { EditTextDropdown } from '../../components/generic/EditTextDropdown';

import { orderBy, sumBy, uniqBy } from 'lodash';
import { doCalc } from '../../components/utils/monthlyCompUtil';
import { GetInfoDialogHelper } from '../../components/generic/basedialog'

export default function MonthlyComp() {
    //const { ownerInfo} = props.compPrm;
    interface IWorkerOptions extends IWorkerInfoShort{
        value: string;
        label: string;
        selected: boolean;
    }
    const [workers, setWorkers] = useState<IWorkerOptions[]>([]);
    const [workerComps, setWorkerComps] = useState<{[workerID:string]:IWorkerCompResponse}>({});    
    const [curWorker, setCurWorker] = useState({
        value: ''
    });
    const [monthes, setMonthes] = useState<{ value: string;
        label: string; }[]>([]);
    const [curMonth, setCurMonth] = useState({
        value: ''
    });
    const [payments, setPayments] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [showDetails, setShowDetails] = useState({});
    const workerToOptin = (w:IWorkerInfoShort) => ({
        value: w.workerID,
        label: `${w.firstName} ${w.lastName}`,
    });

    const errorDlgHelper = GetInfoDialogHelper();
    //load comp params
    useEffect(() => {
        sqlGet({
            table: 'workerComp',
            //fields: ['workerID', 'firstName', 'lastName'],
            //groupByArray: [{ 'field': 'workerID' }]
        }).then((res : {rows:IWorkerCompResponse[]}) => {
            setWorkerComps(res.rows.reduce((acc, wc) => {
                let cmp = acc[wc.workerID];
                if (!cmp) {
                    cmp = [];
                    acc[wc.workerID] = cmp;
                }
                cmp.push(wc);
                return acc;
            }, {}));
            const workerOpts = uniqBy(res.rows, x => x.workerID).map((w, ind) => {                
                return {
                    ...w,
                    value: w.workerID,
                    label: `${w.firstName} ${w.lastName}`,
                    selected: ind === 0,
                } as IWorkerOptions
            })
            setWorkers(workerOpts);
            if (workerOpts.length) {                
                setCurWorker(workerOpts[0]);
            }
            sqlGet({
                table: 'maintenanceRecords',
                fields: ['workerID', 'workerFirstName', 'workerLastName'],
                groupByArray: [{ 'field': 'workerID' }]
            }).then((resMW: {rows:IMaintenanceDataResponse[]}) => {
                const resMWWkr = uniqBy(resMW.rows.map(r => {
                    return {
                        workerID: r.workerID,
                        firstName: r.workerFirstName,
                        lastName: r.workerLastName,
                    }
                }), x => x.workerID);

                const all = uniqBy(workerOpts.concat(resMWWkr.map(r => {
                    return {
                        ...r,
                        selected: false,
                    } as IWorkerOptions
                })), a => a.workerID).map((opt,ind) => {
                    return {
                        ...opt,
                        selected: ind === 0,
                    }
                });
                setWorkers(all)
                if (workerOpts.length) {                
                    setCurWorker(workerOpts.find(w=>w.selected));
                }         
            });
        }).catch(err => {
            
        });       
        
    }, []);
    //load aggregated months
    useEffect(() => {
        if (!curWorker.value) return;
        sqlGet({
            table: 'maintenanceRecords',
            fields: ['month'],
            whereArray: [{
                field: 'workerID',
                op: '=',
                val: curWorker.value,
            }            
        ],
            groupByArray: [{ 'field': 'month' }]
        }).then(res => {
            let rows = res.rows.map(r=>r.month).map(m=>m.substr(0,7));            
            
            sqlGet({
                table: 'rentPaymentInfo',
                fields: ['month'],
                whereArray: [{ field: 'workerID', op: '=', val: curWorker.value }],
                groupByArray: [{ 'field': 'month' }]
            }).then((paymentMonthes: { rows: {month:string}[]}) => {
                let mrows = uniqBy(paymentMonthes.rows.map(r => r.month).concat(rows), x => x);
                mrows = orderBy(mrows, [x => x], ['desc']);
                //console.log(mrows);
                //console.log('payment monthes')
                const m = mrows.map(value => ({
                    value,
                    label: value,
                }));
                setMonthes(m);
                if (m.length) setCurMonth(m[0]);
            })
        });
    }, [curWorker]);
    
    
    useEffect(() => {
        if (!curWorker?.value) return;
        if (!curMonth?.value) return;
        sqlGet({
            table: 'rentPaymentInfo',
            whereArray:[{field:'workerID', op:'=',val: curWorker.value},{field:'month',op:'=',val:curMonth.value}],
        }).then(res => {
            setPayments(res.rows.filter(r => r.includeInCommission !== '0'));
        })

        sqlGet({
            table:'maintenanceRecords',
            whereArray: [{
                field: 'workerID',
                op: '=',
                val: curWorker.value,
            },{field:'month',op:'=',val:curMonth.value}],
        }).then(res=>{
            const rows = orderBy(res.rows,['date']);
            setMaintenanceRecords(rows);
        })
    }, [curMonth.value]);

    const curWorkerCompTops = workerComps[curWorker.value] || [];
    const curWorkerCompTop = curWorkerCompTops[0];
    const {
        curWorkerComp,
        totalEarned,
        monthlyCompRes,
        maintenanceRecordsByExpCat,
        generateCsv,        
    } = doCalc({
        curWorkerCompTop,
        payments,
        maintenanceRecords,
    })
    
    
    //const totalEarned = sumBy(curWorkerComp.map(getCmpAmt),x=>x);
    const csvContent = generateCsv(curMonth?.value);
    return <div style={{display:'flex', height:'100%', flexDirection:'column', boxSizing:'border-box'}}>        
        {
            errorDlgHelper.getDialog()
        }
        <div style={{ display: 'inline-flex', flexShrink:0 }}>
            <div style={{ flex: '1 0 0', order: 1 }}>
                <EditTextDropdown items={workers.map(workerToOptin)} onSelectionChanged={itm => {
                    setCurWorker(itm as {value:string})
                }}
                    formatDisplay={itm=>itm.label}
                ></EditTextDropdown>                
            </div>
            <div style={{ flexFlow: 'row', flex: '1 0 0', order: 1 }}>
            <EditTextDropdown items={monthes} onSelectionChanged={itm => {
                    setCurMonth(itm as {value:string})
                }}
                formatDisplay={itm=>itm.label}
                ></EditTextDropdown>                                
            </div>
            <div>
                <button className='btn btn-primary' onClick={() => {                    
                    var link = document.createElement("a");
                    link.href = window.URL.createObjectURL(
                        new Blob([csvContent.map(c => c.join(', ')).join('\n')], { type: "application/txt" })
                    );
                    link.download = `report-${curMonth?.value}.csv`;

                    document.body.appendChild(link);

                    link.click();
                    setTimeout(function () {
                        window.URL.revokeObjectURL(link.href);
                    }, 200);
                    
                }}>CSV</button>
            </div>
        </div>
        
        {
            true && <div>
                <table className='table'>
                {
                        csvContent.map((csvLine, key) => {
                        
                            return key === 0 ?
                                <thead key={key}>
                                    <tr>
                                    {
                                            csvLine.map((itm, key) => <td key={key}><b>{itm}</b></td>)
                                        }
                                    </tr>
                                </thead>
                                :
                                <tr key={key}>
                                    {
                                        csvLine.map((itm, key) => <td key={key}>{itm}</td>)
                                    }
                                </tr>
                        })
                    }
                </table>
            </div>
        }        
    </div>
}