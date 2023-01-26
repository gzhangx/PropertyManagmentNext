import React, { useState, useEffect } from "react";

import {
    getMaintenanceFromSheet,
    getSheetInfo,
    ISheetInfo,
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
import { CreateSaveButton} from '../../components/generic/SaveFile'

interface IShowDetailsData {
    amount: number;
    address: string;
    notes: string;
    date: string;
    debugText?: string;
}

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
    byCatTotal: IHashWithTotal;
    byCats: IByWorkerIdByCatId;
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
    goodWorkers: { [name: string]: boolean };
    showCategories: {[cat:string]:boolean};
    rawData: IMaintenanceRawData[];
    allRawData: IMaintenanceRawData[];
    dspYear: string,
    byWorkerByCat: IByWorkerByCat;
    ownerID: string;
    curSheetInfo: IEditTextDropdownItem;
    allSheetInfos: IEditTextDropdownItem[];
    exportData: string[][];
}

const amtDsp = (amt: number) => {
    if (!amt) return 0;
    return amt.toFixed(2);
}

function DoubleAryToCsv(data: string[][]): string {
    return data.map(ss => {
        return ss.join(',');
    }).join('\r\n');
}
function GenerateByCatData(state: IYearlyMaintenanceReportState, setShowDetail: React.Dispatch<React.SetStateAction<IShowDetailsData[]>>) {    
    const workerNames = state.byWorkerByCat.workerIds || [];
    const catIds = state.byWorkerByCat.catIds || [];
    const dataBy = state.byWorkerByCat.byCats;
    return <div>
        <div>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        {
                            workerNames.map((n, keyi) => {
                                return <th scope="col" key={keyi}>{n}</th>
                            })
                        }
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        catIds.map((catId, tri) => {
                            return <tr key={tri}>
                                <th scope="row">{catId}</th>
                                {
                                    workerNames.map((workerName, keyi) => {
                                        return <td scope="col" key={keyi} onClick={() => {
                                            const wkrCat = dataBy[catId][workerName];
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
                                                amtDsp(dataBy[catId][workerName]?.total)
                                            }</td>
                                    })
                                }
                            </tr>
                        })
                    }
                    {
                        <tr>
                            <th>Grand Total:</th>
                            {
                                workerNames.map((workerName, keyi) => {
                                    return <td scope="col" key={keyi} onClick={() => {
                                        const wkrCat = state.byWorkerByCat.byWorkerTotal[workerName];
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
                                            amtDsp(state.byWorkerByCat.byWorkerTotal[workerName].total)
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


function GenerateByWorkerByCatDontWantData(state: IYearlyMaintenanceReportState, setShowDetail: React.Dispatch<React.SetStateAction<IShowDetailsData[]>>
) {   
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
        names = sortBy(names, 'name') as { id: string; name: string; }[];

        categoryNames = state.byWorkerByCat.catIds.map(id => {
            const name = state.expenseCategoriesMapping[id] || id;
            return {
                id,
                name,
            }
        });
    }
    return <table className="table">
        <thead>
            <tr>
                <th scope="col">#</th>
                {
                    categoryNames.map((n, keyi) => {
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
                                amtDsp(state.byWorkerByCat?.byCatTotal[cat.id]?.total)
                            }</td>
                        })
                    }
                    <td>{amtDsp(state.byWorkerByCat?.total)}</td>
                </tr>
            }
        </tbody>
    </table>
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
        goodWorkers: {},
        showCategories: {
            'Repair': true,
            'Commission Fee': true,
            'Management fee': true,
            'Pest Control': true,
            'Lawn Maintenance': true,
            'Cleaning': true,            
        },
        rawData: [],
        allRawData: [],
        dspYear: '',
        byWorkerByCat: {} as IByWorkerByCat,
        ownerID: '',
        curSheetInfo: null,
        allSheetInfos: [],
        exportData: [],
    });
    
    useEffect(() => { 
        getSheetInfo().then(res => {
            const opts: IEditTextDropdownItem[] = res.map(r => {
                return {
                    label: r.desc,
                    value: r.sheetId,
                } as IEditTextDropdownItem
            })
            setState(prev => {
                return {
                    ...prev,
                    curSheetInfo: opts[0],
                    allSheetInfos: opts,
                }
            })
        })                
    }, []);


    async function getData() {
        if (!state.curSheetInfo) return;
        if (!state.curSheetInfo.value) return;
        await getMaintenanceFromSheet(state.curSheetInfo.value, 'Workers Info').then(rows => {
            const goodWorkers = rows.reduce((acc, r) => {
                acc[r.workerID] = true;
                return acc;
            }, {} as { [name: string]: boolean });
            setState(prev => {
                return {
                    ...prev,
                    goodWorkers,
                }
            })
        });
        await getMaintenanceFromSheet(state.curSheetInfo.value, 'MaintainessRecord').then(rows => {
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
                const minDate = reduInfo.minDate;
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
            } else {
                setState(prev => ({
                    ...prev,                    
                    ownerID: 'TODOADD',
                    curYearOptions: [],
                    curYearSelection: {label:'No year'},
                    allRawData: [],
                }));
            }
        }).catch(err => {
            console.log(err);
        });
    }
    useEffect(() => {
        getData();
    }, [state.curSheetInfo]);
    useEffect(() => {
        console.log(`loading data for ${state.dspYear}`)
        getDataForYYYY(state, setState);
    }, [state.dspYear]);

    useEffect(() => {
        formatData(state, setState);
    }, [state.rawData, state.showCategories, state.goodWorkers]);

    
    const [showDetail, setShowDetail] = useState<IShowDetailsData[] | null>(null);        

    
    return <div>
        <div className="row">
            <div className="col-sm-4">
                <EditTextDropdown selected={ state.curYearSelection} items={state.curYearOptions} onSelectionChanged={sel => {
                    setState({
                        ...state,
                        dspYear: sel?.value || '',
                        curYearSelection: sel,
                    })
                }} ></EditTextDropdown>
            </div>
            <div className="col-sm-4">
                <EditTextDropdown selected={state.curSheetInfo} items={state.allSheetInfos} onSelectionChanged={sel => {
                    setState({
                        ...state,                        
                        curSheetInfo: sel,
                    })
                }} ></EditTextDropdown></div>
            <div className="col-sm-2">
                {
                    state.exportData.length ? <CreateSaveButton content={DoubleAryToCsv(state.exportData)} />:''
                }
            </div>
        </div>

        <CloseableDialog show={!!showDetail} title='Item Details' setShow={() => setShowDetail(null)}>
            <div className="modal-body">
                <div>
                    {                    
                        showDetail ? <CreateSaveButton content={showDetail.map(d => `${d.amount.toFixed(2)},${d.date},${d.address},${d.notes},${d.debugText}`).join('\n')}  />:''
                    }
                </div>
            <table>
                {
                    sortBy((showDetail || [] as IShowDetailsData[]), 'date').map((d,tri) => {
                        return <tr key={tri}><td>{d.amount.toFixed(2)}</td><td>{d.date}</td> <td>{d.address}</td><td> {d.notes}</td> <td>{d.debugText}</td></tr>
                    })

                }
                </table>
            </div>
        </CloseableDialog>
        <div>
            <div className="container">
                
            </div>
            {
                GenerateByCatData(state, setShowDetail)
            }
            {
                //GenerateByWorkerByCatDontWantData(state, setShowDetail)
            }
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


    function getDspWorker(row: IMaintenanceRawData) {
        if (!state.goodWorkers[row.workerID]) {
            return "OtherUser";
        }        
        return row.workerID;
    }

    const byWorkerByCat = dataRows.reduce((acc, d) => {
        //if (!state.showWorkers[d.workerID]) return acc;
        if (!state.showCategories[d.expenseCategoryId]) return acc;

        const workerID = getDspWorker(d);
        if (!acc.workerIdHashFind[workerID]) {
            acc.workerIdHashFind[workerID] = true;
            acc.workerIds.push(workerID);
        }
        

        if (!acc.catIdHashFind[d.expenseCategoryId]) {
            acc.catIdHashFind[d.expenseCategoryId] = true;
            acc.catIds.push(d.expenseCategoryId);
        }
        const wkr = getSet(acc.byWorker, workerID, {});
        const exp = getSet(wkr, d.expenseCategoryId, {
            total: 0,
            items: [],
        });
        exp.total += d.amount;
        exp.items.push(d);

        const wkrTotal = getSet(acc.byWorkerTotal, workerID, {total: 0, items:[]}) as IWithTotal;
        wkrTotal.total += d.amount;
        wkrTotal.items.push(d);


        const catTotal = getSet(acc.byCatTotal, d.expenseCategoryId, { total: 0, items: [] }) as IWithTotal;
        catTotal.total += d.amount;
        catTotal.items.push(d);

        const byCats = getSet(acc.byCats, d.expenseCategoryId, {});
        const byCatByWorker = getSet(byCats, d.workerID, {
            total: 0,
            items: [],
        });
        byCatByWorker.total += d.amount;
        byCatByWorker.items.push(d);
        acc.total += d.amount;
        //console.log('byCats.total', byCats.total, wkrTotal.total, d.amount);
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
        byCatTotal: {},
    } as IByWorkerByCat);

    
    const totalByWorker = byWorkerByCat.workerIds.reduce((acc, wn) => {
        acc += byWorkerByCat.byWorkerTotal[wn].total;
        return acc;
    }, 0);
    const exportData = [[''].concat(byWorkerByCat.workerIds)];
    const totalByCat = byWorkerByCat.catIds.reduce((acc, cid) => {
        acc += byWorkerByCat.byCatTotal[cid].total;
        exportData.push([cid,...byWorkerByCat.workerIds.map(w => (byWorkerByCat.byCats[cid][w]?.total || 0).toFixed(2))]);
        return acc;
    }, 0);        
    console.log('totals', exportData)
    console.log(`tota=${byWorkerByCat.total} by worker total=${totalByWorker} bycattota=${totalByCat}`); //just to veryf
    setState(prev => ({
        ...prev,
        byWorkerByCat,
        exportData,
    }));
}