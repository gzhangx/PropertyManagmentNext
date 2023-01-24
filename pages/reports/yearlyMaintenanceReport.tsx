import React, { useState, useEffect } from "react";

import {
    getMaintenanceFromSheet,
} from '../../components/api';
import moment from 'moment';
//import EditDropdown, {IOptions} from '../paymentMatch/EditDropdown';
import { EditTextDropdown , IEditTextDropdownItem } from '../../components/generic/EditTextDropdown';
import { sortBy, words } from "lodash";
import {
    IIncomeExpensesContextValue, IWorkerInfo,
    IMaintenanceRawData,
} from '../../components/reportTypes';

import { CloseableDialog } from '../../components/generic/basedialog'


interface IWithTotal {
    total: number;
    items: IMaintenanceRawData[];
}
interface IHashWithTotal {
    [catOrWkr: string]: IWithTotal;
}

interface IByWorkerIdByCatId {
    [wkr: string]: IHashWithTotal;
}
interface IByWorkerByCat {
    byWorker: IByWorkerIdByCatId;
    byWorkerTotal: IHashWithTotal;
    byCats: IHashWithTotal;
    total: number;
    workerIds: string[];
    workerIdHashFind: { [id: string]: boolean };
    catIds: string[];
    catIdHashFind: { [id: string]: boolean };
}

interface IYearlyMaintenanceReportState {
    curYearSelection: IEditTextDropdownItem;
    curYearOptions: IEditTextDropdownItem[];
    expenseCategories: { id: string, name: string; }[];
    expenseCategoriesMapping: { [id: string]: string };
    workerInfos: IWorkerInfo[];
    workerInfoMapping: { [id: string]: IWorkerInfo };
    showWorkers: { [id: string]: boolean };
    showCategories: {[cat:string]:boolean};
    rawData: IMaintenanceRawData[];
    allRawData: IMaintenanceRawData[];
    dspYear: string,
    byWorkerByCat: IByWorkerByCat;
    ownerID: string;
}

export default function YearlyMaintenanceReport() {
    
    const [state, setState] = useState<IYearlyMaintenanceReportState>({
        curYearSelection: { label: 'NA', value: 'NA' } as IEditTextDropdownItem,
        curYearOptions: [],
        expenseCategories: [],
        expenseCategoriesMapping: {},
        workerInfos: [],
        workerInfoMapping: {},
        showWorkers: {},
        showCategories: {},
        rawData: [],
        allRawData: [],
        dspYear: '',
        byWorkerByCat: {} as IByWorkerByCat,
        ownerID: '',
    });
    
    useEffect(() => {
 
        getMaintenanceFromSheet('Workers Info').then(res => {
            
        });
        getMaintenanceFromSheet('MaintainessRecord').then(rows => {
            const reduInfo = rows.reduce((acc, row) => {
                if (row.date < acc.minDate) {
                    console.log('useing min date (orig,new)', acc.minDate, row.date);
                    acc.minDate = row.date;                    
                }
                return acc;
            }, {
                minDate: '9999-99-99',
            })
            
            console.log('setting up maintenacedata info for yearly Maintenance')
            if (rows && rows.length) {
                const  minDate = reduInfo.minDate;
                const fromYYYY = moment(minDate).format('YYYY');
                const currentYYYY = moment().format('YYYY');
                const years = [] as string[];
                for (let i = parseInt(currentYYYY); i >= parseInt(fromYYYY); i--) {
                    years.push(i.toString());
                }
                const dspYear = ((years[1] || years[0]) || '').toString();
                console.log(`setting dspYear ${dspYear} length of ypar op=${years.length}`)
                if (years.length === 0) {
                    console.log('year ret is ');
                    
                }
                setState(prev => ({
                    ...prev,
                    minDate,
                    fromYYYY,
                    dspYear,
                    ownerID: 'TODOADD',
                    curYearOptions: years.map(y => ({ label: y, value: y })),
                    curYearSelection: { label: dspYear, value: dspYear },
                    allRawData: rows,
                }));
            }
        });





    }, []);


    useEffect(() => {
        console.log(`loading data for ${state.dspYear}`)
        getDataForYYYY(state, setState);
    }, [state.dspYear]);

    useEffect(() => {
        formatData(state, setState);
    }, [state.rawData, state.showCategories]);

    interface IShowDetailsData {
        amount: number;
        address: string;
        notes: string;
        date: string;
        debugText?: string;
    }
    const [showDetail, setShowDetail] = useState<IShowDetailsData[] | null>(null);

    let names: { id: string; name: string; }[] = [];
    let categoryNames: { id: string; name: string; }[] = [];
    if (state.byWorkerByCat && state.byWorkerByCat.workerIds) {
        names = state.byWorkerByCat.workerIds.map(id => {
            const wi = state.workerInfoMapping[id];
            if (!wi) {
                return {
                    id,
                    name: id,
                }
            } else {
                return {
                    id,
                    name: `${wi.firstName} ${wi.lastName}`
                }
            }
        });
        names = sortBy(names, 'name') as { id: string; name: string;}[];

        categoryNames = state.byWorkerByCat.catIds.map(id => {
            const name = state.expenseCategoriesMapping[id] || id;
            return {
                id,
                name,
            }
        });
    }


    const amtDsp = (amt: number) => {
        if (!amt) return 0;
        return amt.toFixed(2);
    }
    return <div><EditTextDropdown items={state.curYearOptions} onSelectionChanged={sel => {        
            setState({
                ...state,
                dspYear: sel?.value || '',
                curYearSelection: sel,
            })        
    }} ></EditTextDropdown>
        <CloseableDialog show={!!showDetail} setShow={() => setShowDetail(null)}>
            <table>
                {
                    sortBy((showDetail || [] as IShowDetailsData[]), 'date').map(d => {
                        return <tr><td>{d.amount.toFixed(2)}</td><td>{d.date}</td> <td>{d.address}</td><td> {d.notes}</td> <td>{d.debugText}</td></tr>
                    })

                }
            </table>
        </CloseableDialog>
        <div>
            <div className="container">
                {
                    state.expenseCategories.map((exp,keyi) => {
                        return <>
                            <input type="checkbox" className="form-check-input" id="exampleCheck1"
                                   checked={state.showCategories[exp.id]}
                                   onClick={() => {
                                       setState(prev => ({
                                           ...prev,
                                           showCategories: {
                                               ...state.showCategories,
                                               [exp.id]: !state.showCategories[exp.id],
                                           }
                                       }));
                                   }}
                            ></input>
                            <span className="border" key={keyi}  >{exp.name}</span>
                            <span> </span>
                        </>
                    })
                }
            </div>
            <table className="table">
                <thead>
                <tr>
                    <th scope="col">#</th>
                    {
                        categoryNames.map((n,keyi) => {
                            return <th scope="col" key={keyi}>{n.name}</th>
                        })
                    }
                    <th>Total</th>
                </tr>
                </thead>
                <tbody>
                {
                    names.map((n, tri) => {
                        return <tr key={tri}>
                            <th scope="row">{n.name}</th>
                            {
                                categoryNames.map((cat, keyi) => {
                                    return <td scope="col" key={keyi} onClick={() => {
                                        const wkrCat = state.byWorkerByCat.byWorker[n.id][cat.id];
                                        if (!wkrCat) return;
                                        setShowDetail(wkrCat.items.map(itm => {
                                            let date = itm.date;
                                            if (date.length > 10) date = date.substring(0, 10);
                                            return {
                                                address: itm.houseID,
                                                amount: itm.amount,
                                                date,
                                                notes: itm.description,
                                            } as IShowDetailsData;
                                        }))
                                    }}>{
                                        amtDsp(state.byWorkerByCat.byWorker[n.id][cat.id]?.total)
                                    }</td>
                                })
                            }
                            <td onClick={() => {
                                const wkrCat = state.byWorkerByCat.byWorkerTotal[n.id];
                                if (!wkrCat) return;
                                setShowDetail(wkrCat.items.map(itm => {
                                    let date = itm.date;
                                    if (date.length > 10) date = date.substring(0, 10);
                                    return {
                                        address: itm.houseID,
                                        amount: itm.amount,
                                        date,
                                        notes: itm.description,
                                    } as IShowDetailsData;
                                }))
                            }}>{amtDsp(state.byWorkerByCat.byWorkerTotal[n.id].total)}</td>
                        </tr>
                    })
                }
                {
                    <tr>
                        <th>Grand Total:</th>
                        {
                            categoryNames.map((cat, keyi) => {
                                return <td scope="col" key={keyi}>{
                                    amtDsp(state.byWorkerByCat.byCats[cat.id]?.total)
                                }</td>
                            })
                        }
                        <td>{amtDsp(state.byWorkerByCat?.total)}</td>
                    </tr>
                }
                </tbody>
            </table>
        </div>
    </div>
}

function getDataForYYYY(state: IYearlyMaintenanceReportState, setState: React.Dispatch<React.SetStateAction<IYearlyMaintenanceReportState>>) {
    const { dspYear, ownerID } = state;
    if (!dspYear) return;
    const m = moment(dspYear, 'YYYY');
    console.log(`data for ${dspYear} is `);
    console.log(m.toDate().toISOString());
    const startDate = m.format('YYYY-MM-DD');
    const endDate = m.add(1, 'year').startOf('year').format('YYYY-MM-DD');
    console.log(`star= ${startDate} end=${endDate}`)
    setState(prev => ({
            ...prev,
        rawData: prev.allRawData.filter(d => {
            return d.date >= startDate && d.date <= endDate;
            }),
    }))
    //getAllMaintenanceData(ownerID, startDate, endDate).then(rrr => {
    //    const dataRows = rrr.rows;
    //    setState(prev=>({
    //        ...prev,
    //        rawData: dataRows,
    //    }))
    //    //formatData(state, setState);
    //});
}


function formatData(state: IYearlyMaintenanceReportState, setState: React.Dispatch<React.SetStateAction<IYearlyMaintenanceReportState>>) {
    const dataRows = state.rawData;
    function getSet<T extends (IWithTotal | IHashWithTotal)>(obj: {[id:string]:T}, id: string, init: T) {
        let r = obj[id];
        if (!r) {
            r = init;
            obj[id] = r;
        }
        return r;
    }


    function sortRowSpecial(row: IMaintenanceRawData) {
        if (row.expenseCategoryId === 'food and drink') {
            row.workerID = 'Resturant';
            row.comment = row.workerID;
        }
        const workerID = row.workerID;
        if (workerID.startsWith('AMZN') || workerID.startsWith('Amazon')) {
            row.workerID = 'Amazon';
        }
        if (workerID.startsWith('THE HOME DEPOT') || workerID.startsWith('HOMEDEPOT')) {
            row.workerID = 'HOMEDEPOT';
        }
        if (workerID.startsWith('LOWES')) {
            row.workerID = 'LOWES';
        }
    }
    const byWorkerByCat = dataRows.reduce((acc, d) => {
        //if (!state.showWorkers[d.workerID]) return acc;
        //if (!state.showCategories[d.expenseCategoryId]) return acc;

        sortRowSpecial(d);
        if (!acc.workerIdHashFind[d.workerID]) {
            acc.workerIdHashFind[d.workerID] = true;
            acc.workerIds.push(d.workerID);
        }
        

        if (!acc.catIdHashFind[d.expenseCategoryId]) {
            acc.catIdHashFind[d.expenseCategoryId] = true;
            acc.catIds.push(d.expenseCategoryId);
        }
        const wkr = getSet(acc.byWorker, d.workerID, {});
        const exp = getSet(wkr, d.expenseCategoryId, {
            total: 0,
            items: [],
        });
        exp.total += d.amount;
        exp.items.push(d);

        const wkrTotal = getSet(acc.byWorkerTotal, d.workerID, {total: 0, items:[]}) as IWithTotal;
        wkrTotal.total += d.amount;
        wkrTotal.items.push(d);

        const byCats = getSet(acc.byCats, d.expenseCategoryId, { total: 0, items:[] }) as IWithTotal;
        byCats.total += d.amount;
        byCats.items.push(d);
        acc.total += d.amount;
        return acc;
    }, {
        byWorker: {},
        byCats: {},
        total: 0,
        workerIds: [] as string[],
        workerIdHashFind: {},
        catIds: [],
        catIdHashFind: {},
        byWorkerTotal: {},
    } as IByWorkerByCat);
    setState(prev => ({
        ...prev,
        byWorkerByCat,
    }));
}