import React, { useState, useEffect } from "react";

import {
    getMaintenanceFromSheet,
    getHouseInfoFromSheet,
    IHouseSheetInfo,
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
    workerIds: string[];
    dspWorkerIds: string[];
    progressText: string;
    houseInfo: IHouseSheetInfo[];
    curSelectedOwner: IEditTextDropdownItem;
    curOwnerOptions: IEditTextDropdownItem[];
    houseToOwnerMap: {
        [houseName: string]: string;
    }
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
    const workerNames = state.dspWorkerIds || [];
    const catIds = state.byWorkerByCat.catIds || [];
    const dataBy = state.byWorkerByCat.byCats;
    const get1099Color = (wkrCat:IWithTotal):(React.CSSProperties) => {
        return wkrCat?.total >= 600 ? {
            fontWeight: 'bold',
            color: 'green'
        } : {}
    }
    return <div>
        <div>
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        {
                            workerNames.map((n, keyi) => {
                                const wkrCat = state.byWorkerByCat.byWorkerTotal[n];
                                const showDetail = () => {
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
                                }
                                return <th scope="col" key={keyi} style={get1099Color(wkrCat)} onClick={showDetail}>{n}</th>
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
                                        const wkrCat = dataBy[catId][workerName];
                                        return <td scope="col" key={keyi} onClick={() => {                                            
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
                                                amtDsp(wkrCat?.total)
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
                                    const wkrCat = state.byWorkerByCat.byWorkerTotal[workerName];
                                    
                                    return <td scope="col" style={get1099Color(wkrCat)} key={keyi}>{
                                        amtDsp(wkrCat?.total)
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
    if (state.dspWorkerIds) {
        names = state.dspWorkerIds.map(id => {
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
        workerIds:[],
        dspWorkerIds: [],
        progressText: '',
        houseInfo: [],
        curSelectedOwner: { label: 'NA' },
        curOwnerOptions: [],
        houseToOwnerMap: {},
    });
    
    const showProgress = progressText => setState(prev => {
        return {
            ...prev,
            progressText,
        }
    })
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
        showProgress('Getting worker Info for ' + state.curSheetInfo.label);
        const goodWorkers = await getMaintenanceFromSheet(state.curSheetInfo.value, 'Workers Info').then(rows => {
            const goodWorkers = rows.reduce((acc, r) => {
                acc[r.workerID] = true;
                return acc;
            }, {} as { [name: string]: boolean });            
            return goodWorkers;
        });

        showProgress('Getting house infor');
        const houssInfoEtc = await getHouseInfoFromSheet(state.curSheetInfo.value).then(houseInfo => {
            //console.log('houseInfo', houseInfo);
            const owners = houseInfo.reduce((acc, h) => {
                acc.houseDict[h.houseName] = h.ownerName;
                if (!acc.ownerDict[h.ownerName]) {
                    acc.ownerDict[h.ownerName] = true;
                    acc.owners.push(h.ownerName);
                }
                return acc;
            }, {
                ownerDict: {},
                houseDict: {},
                owners: [] as string[],
            });
            const curOwnerOptions = owners.owners.map(o => {
                return {
                    label: o,
                    value: o,
               } 
            });
            return {
                goodWorkers,
                houseInfo,
                curSelectedOwner: curOwnerOptions[0] || { label: 'NA' },
                curOwnerOptions,
                houseToOwnerMap: owners.houseDict,
            }            
        });
        showProgress('Getting Data for ' + state.curSheetInfo.label);
        await getMaintenanceFromSheet(state.curSheetInfo.value, 'MaintainessRecord').then(rawRows => {
            showProgress('');
            const rows = rawRows.filter(row => {
                if (!state.showCategories[row.expenseCategoryId]) return false;
                return true;
            });
            const showWorkers = {};
            const reduInfo = rows.reduce((acc, row) => {
                if (row.date < acc.minDate) {
                    console.log('useing min date (orig,new)', acc.minDate, row.date);
                    acc.minDate = row.date;
                }                
                showWorkers[getDspWorker(state, row)] = true;
                return acc;
            }, {
                minDate: '9999-99-99',
            })

            console.log('setting up maintenacedata info for yearly Maintenance', showWorkers)
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
                //console.log('setting state after main data', houssInfoEtc.goodWorkers)
                setState(prev => {
                    const newState = {
                        ...prev,
                        minDate,
                        fromYYYY,
                        dspYear,
                        ownerID: 'TODOADD',
                        curYearOptions: years.map(y => ({ label: y, value: y })),
                        curYearSelection: { label: dspYear, value: dspYear },
                        allRawData: rows,
                        showWorkers,
                        ...houssInfoEtc,
                    }
                    getDataForYYYY(newState, setState);
                    return newState;
                });
            } else {
                setState(prev => ({
                    ...prev,                    
                    ownerID: 'TODOADD',
                    curYearOptions: [],
                    curYearSelection: {label:'No year'},
                    allRawData: [],
                    showWorkers: {},
                    ...houssInfoEtc,
                }));
            }
        }).catch(err => {
            showProgress(err.message);
            console.log(err);
        });
        
    }
    useEffect(() => {
        getData();
    }, [state.curSheetInfo]);
    useEffect(() => {
        //console.log(`loading data for ${state.dspYear}`, state.goodWorkers)
        getDataForYYYY(state, setState);
    }, [state.dspYear, state.curSelectedOwner?.label]);

    const curShowWorkers = state.dspWorkerIds.map(w => {
        return `${w}:${!!state.showWorkers[w]}`
    }).join(',');
    useEffect(() => {
        formatData(state, setState);
    }, [state.curYearSelection?.label, state.curSelectedOwner?.label, state.curSheetInfo?.label,  curShowWorkers]);

    
    const [showDetail, setShowDetail] = useState<IShowDetailsData[] | null>(null);        

    
    return <div>
        <div className="row">
            <div className="col-sm-3">
                <EditTextDropdown selected={ state.curYearSelection} items={state.curYearOptions} onSelectionChanged={sel => {
                    setState({
                        ...state,
                        dspYear: sel?.value || '',
                        curYearSelection: sel,
                    })
                }} ></EditTextDropdown>
            </div>
            <div className="col-sm-3">
                <EditTextDropdown selected={state.curSheetInfo} items={state.allSheetInfos} onSelectionChanged={sel => {
                    setState({
                        ...state,                        
                        curSheetInfo: sel,
                    })
                }} ></EditTextDropdown></div>
            <div className="col-sm-3">
                <EditTextDropdown selected={state.curSelectedOwner} items={state.curOwnerOptions} onSelectionChanged={sel => {
                    setState({
                        ...state,
                        curSelectedOwner: sel,
                    })
                }} ></EditTextDropdown></div>
            <div className="col-sm-2">
                {
                    state.exportData.length ? <CreateSaveButton content={DoubleAryToCsv(state.exportData)} />:''
                }
            </div>
        </div>
        <div className="row">
            
                {
                    (state.workerIds || []).map((w,wi) => {
                        return <div key={wi} className='' style={{
                            marginLeft: '40px'
                        }}><input className="form-check-input" type='checkbox' checked={state.showWorkers[w]}
                                onChange={() => {
                                    state.showWorkers[w] = !state.showWorkers[w];                                    
                                    setState(prev => {
                                        let dspWorkerIds = prev.dspWorkerIds;
                                        if (prev.showWorkers[w]) {
                                            if (!dspWorkerIds.includes(w)) {
                                                dspWorkerIds.push(w);
                                                dspWorkerIds.sort();
                                            }
                                        } else {
                                            dspWorkerIds = dspWorkerIds.filter(dw => dw != w);
                                        }
                                        return {
                                            ...prev,
                                            showWorkers: state.showWorkers,
                                            dspWorkerIds,
                                        }
                                    })
                                }}
                            /><label className="form-check-label" style={{
                            marginRight:'10px'
                        }}>{w}</label></div>
                    })
                }
            
        </div>

        <CloseableDialog show={!!state.progressText} title='Progress' setShow={() => {
            showProgress('');
        }}>
            <div className="modal-body">
                <div>
                    {state.progressText}
                </div>                
            </div>
        </CloseableDialog>
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
    const { dspYear } = state;
    if (!dspYear) return;
    const m = moment(dspYear, 'YYYY');
    console.log(`data for ${dspYear} is `);
    console.log(m.toDate().toISOString());
    const startDate = m.format('YYYY-MM-DD');
    const endDate = m.add(1, 'year').startOf('year').format('YYYY-MM-DD');
    console.log(`star= ${startDate} end=${endDate}`)
    const rawData = state.allRawData.filter(d => {
        const ownerID = state.houseToOwnerMap[d.houseID];
        if (ownerID) {
            if (ownerID !== state.curSelectedOwner.value) return false;
        }
        return d.date >= startDate && d.date <= endDate;
    });
    const showWorkers = {};
    const workerIdsAcc = rawData.reduce((acc, r) => {
        const workerId = getDspWorker(state, r)
        if (!acc.found[workerId]) {
            console.log('adding worker', workerId, r)
            acc.found[workerId] = true;
            acc.ary.push(workerId);
            showWorkers[workerId] = true;
        }
        return acc;
    }, {
        ary: [] as string[],
        found: {} as {[name:string]:boolean}
    });
    const workerIds = workerIdsAcc.ary.sort();
    const dspWorkerIds = workerIds;
    setState(prev => ({
        ...prev,
        rawData,        
        workerIds,
        dspWorkerIds,
        showWorkers,
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

function getDspWorker(state: IYearlyMaintenanceReportState, row: IMaintenanceRawData) {
    if (!state.goodWorkers[row.workerID]) {
        return "OtherUser";
    }
    return row.workerID;
}

function round2(num: number) {
    return Math.round(num * 100) / 100
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


    

    const byWorkerByCat = dataRows.reduce((acc, d) => {
        const ownerId = state.houseToOwnerMap[d.houseID];
        if (ownerId) {
            if (ownerId !== state.curSelectedOwner.value) {
                //console.log(`ignoring due to diff owner ${ownerId}!=${state.curSelectedOwner.value} ${d.date} ${d.amount} ${d.houseID}`)
                return acc;
            }
        }
        if (!state.showWorkers[d.workerID]) {
            return acc;
        }
        if (!state.showCategories[d.expenseCategoryId]) return acc;

        const workerID = getDspWorker(state, d);
        if (!acc.workerIdHashFind[workerID]) {
            acc.workerIdHashFind[workerID] = true;
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
        exp.total = round2(exp.total);
        exp.items.push(d);

        const wkrTotal = getSet(acc.byWorkerTotal, workerID, {total: 0, items:[]}) as IWithTotal;
        wkrTotal.total += d.amount;
        wkrTotal.total = round2(wkrTotal.total);
        wkrTotal.items.push(d);


        const catTotal = getSet(acc.byCatTotal, d.expenseCategoryId, { total: 0, items: [] }) as IWithTotal;
        catTotal.total += d.amount;
        catTotal.total = round2(catTotal.total);
        catTotal.items.push(d);

        const byCats = getSet(acc.byCats, d.expenseCategoryId, {});
        const byCatByWorker = getSet(byCats, d.workerID, {
            total: 0,
            items: [],
        });
        byCatByWorker.total += d.amount;
        byCatByWorker.total = round2(byCatByWorker.total);
        byCatByWorker.items.push(d);
        acc.total += d.amount;
        acc.total = round2(acc.total)
        //console.log('byCats.total', byCats.total, wkrTotal.total, d.amount);
        return acc;
    }, {
        byWorker: {},
        byCats: {},
        total: 0,
        workerIdHashFind: {},
        catIds: [],
        catIdHashFind: {},
        byWorkerTotal: {},
        byCatTotal: {},
    } as IByWorkerByCat);

    
    const totalByWorker = state.workerIds.reduce((acc, wn) => {
        acc += byWorkerByCat.byWorkerTotal[wn]?.total || 0;
        return acc;
    }, 0);
    const exportData = [[''].concat(state.dspWorkerIds)];
    const totalByCat = byWorkerByCat.catIds.reduce((acc, cid) => {
        acc += byWorkerByCat.byCatTotal[cid].total;
        exportData.push([cid,...state.dspWorkerIds.map(w => (byWorkerByCat.byCats[cid][w]?.total || 0).toFixed(2))]);
        return acc;
    }, 0);        
    //console.log('totals', exportData)
    console.log(`tota=${byWorkerByCat.total} by worker total=${totalByWorker} bycattota=${totalByCat}`); //just to veryf
    setState(prev => ({
        ...prev,
        byWorkerByCat,
        exportData,
    }));
}