import React, { useState, useEffect } from "react";
import { PDFDocument } from 'pdf-lib'
import {
    getMaintenanceFromSheet,    
    getHouseInfo,
    getWorkerInfo,
    doPost,
    getOwnerInfo,
} from '../../components/api';
import moment from 'moment';
import { EditTextDropdown  } from '../../components/generic/EditTextDropdown';
import { sortBy, words } from "lodash";
import {
    IWorkerInfo,
    IMaintenanceRawData,
    IHouseInfo,
} from '../../components/reportTypes';

import { CloseableDialog } from '../../components/generic/basedialog'
import { CreateSaveButton} from '../../components/generic/SaveFile'
import { IEditTextDropdownItem } from "../../components/generic/GenericDropdown";

interface IShowDetailsData {
    amount: number;
    address: string;
    houseID: string;
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
    curYearSelection: string;
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
    byWorkerByCat: IByWorkerByCat;
    exportData: string[][];
    workerIds: string[];
    dspWorkerIds: string[];
    progressText: string;
    houseInfo: IHouseInfo[];
    curSelectedOwner: string;
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

type IDetailParams = {
    details: IShowDetailsData[];
    total: number;
    export1099: boolean;
    workerName: string;
    ownerName: string;
    YYYY: string;
};

function GenerateByCatData(state: IYearlyMaintenanceReportState, setShowDetail: React.Dispatch<React.SetStateAction<IDetailParams>>) {    
    const workerNames = state.dspWorkerIds || [];
    const catIds = state.byWorkerByCat.catIds || [];
    const dataBy = state.byWorkerByCat.byCats;
    const get1099Color = (wkrCat:IWithTotal):(React.CSSProperties) => {
        return wkrCat?.total >= 600 ? {
            fontWeight: 'bold',
            color: 'green'
        } : {}
    }
    function translateHouseIdToAddress(houseID: string) {
        const house = state.houseInfo.find(h => h.houseID === houseID);
        if (house) {
            return house.address;
        } 
        return houseID;
    }
    const showv1 = true;
    const showDetail = (wkrCat: IWithTotal, workerName: string) => {
        if (!wkrCat) return;
        const details = wkrCat.items.map(itm => {
            let date = itm.date;
            if (date.length > 10) date = date.substring(0, 10);
            const detail: IShowDetailsData = {
                houseID: itm.houseID,
                address: itm.houseID,
                amount: itm.amount,
                date,
                notes: itm.description,
            };
            detail.address = translateHouseIdToAddress(itm.houseID);
            return detail;
        });
        setShowDetail({
            details,
            export1099: !!workerName,
            workerName,
            total: wkrCat.total,
            YYYY: state.curYearSelection.substring(0, 4),
            ownerName: state.curSelectedOwner,
        })
    }
    return <div>
        <div>
            { !showv1 && <table className="table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        {
                            workerNames.map((n, keyi) => {
                                const wkrCat = state.byWorkerByCat.byWorkerTotal[n];
                                return <th scope="col" key={keyi} style={get1099Color(wkrCat)} onClick={()=>showDetail(wkrCat, n)}>{n}</th>
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
                                        return <td scope="col" key={keyi} onClick={() => () => showDetail(wkrCat, '')}>{
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
            }
            <table className="table">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th>Total</th>
                        {
                            catIds.map((catId, tri) => {
                                return <th key={tri}>{catId}</th>
                            })
                        }                        
                    </tr>
                </thead>
                <tbody>                    
                    {
                        workerNames.map((workerName, keyi) => {
                            const wkrCat = state.byWorkerByCat.byWorkerTotal[workerName];                            
                            return <tr key={keyi} style={get1099Color(wkrCat)} >
                                <th scope="row" onClick={() => showDetail(wkrCat, workerName)}>{workerName}</th>
                                <td key={'total'+keyi}>{amtDsp(state.byWorkerByCat.byWorkerTotal[workerName]?.total)}</td>
                                {
                                    catIds.map((catId, tri) => {                                        
                                        const wkrCat = dataBy[catId][workerName];
                                        return <td scope="col" key={tri} onClick={()=>showDetail(wkrCat, '')}>{
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
                                catIds.map((catId, keyi) => {
                                    const wkrCat = state.byWorkerByCat.byCatTotal[catId];

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




export default function YearlyMaintenanceReport() {
    
    const [state, setState] = useState<IYearlyMaintenanceReportState>({
        curYearSelection: '',
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
        byWorkerByCat: {} as IByWorkerByCat,     
        exportData: [],
        workerIds:[],
        dspWorkerIds: [],
        progressText: '',
        houseInfo: [],
        curSelectedOwner: 'NA',
        curOwnerOptions: [],
        houseToOwnerMap: {},
    });
    
    const showProgress = progressText => setState(prev => {
        return {
            ...prev,
            progressText,
        }
    })



    async function getData() {        
        showProgress('Getting worker Info for ');
        const goodWorkers = await getMaintenanceFromSheet().then(rows => {
            const goodWorkers = rows.reduce((acc, r) => {
                acc[r.workerID] = true;
                return acc;
            }, {} as { [name: string]: boolean });            
            return goodWorkers;
        });

        showProgress('Getting house infor');
        const houssInfoEtc = await getHouseInfo().then(houseInfo => {
            //console.log('houseInfo', houseInfo);
            const owners = houseInfo.reduce((acc, h) => {
                acc.houseDict[h.houseID] = h.ownerName;
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
                curSelectedOwner: curOwnerOptions[0].label || 'NA' ,
                curOwnerOptions,
                houseToOwnerMap: owners.houseDict,
            }            
        });
        showProgress('Getting Data for ');
        await getMaintenanceFromSheet().then(rawRows => {
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
                    const newState: IYearlyMaintenanceReportState = {
                        ...prev,
                        //minDate,
                        //fromYYYY,
                        //ownerName: 'TODOADD',
                        curYearOptions: years.map(y => ({ label: y, value: y })),
                        curYearSelection: dspYear,
                        allRawData: rows,
                        showWorkers,
                        ...houssInfoEtc,
                    }
                    getDataForYYYY(newState, setState);
                    return newState;
                });
            } else {
                setState(prev => {
                    const res: IYearlyMaintenanceReportState = ({
                        ...prev,
                        //ownerName: 'TODOADD',
                        curYearOptions: [],
                        curYearSelection: 'No year' ,
                        allRawData: [],
                        showWorkers: {},
                        ...houssInfoEtc,
                    });
                    return res;
                });
            }
        }).catch(err => {
            showProgress(err.message);
            console.log(err);
        });
        
    }
    useEffect(() => {
        getData();
    }, ['once']);
    useEffect(() => {
        //console.log(`loading data for ${state.dspYear}`, state.goodWorkers)
        getDataForYYYY(state, setState);
    }, [state.curYearSelection, state.curSelectedOwner]);

    const curShowWorkers = state.dspWorkerIds.map(w => {
        return `${w}:${!!state.showWorkers[w]}`
    }).join(',');
    useEffect(() => {
        formatData(state, setState);
    }, [state.curYearSelection, state.curSelectedOwner,  curShowWorkers]);

    
    const [showDetail, setShowDetail] = useState<IDetailParams | null>(null);        

    
    return <div>
        <div className="row">
            <div className="col-sm-3">
                <EditTextDropdown items={state.curYearOptions.map(o => ({
                    ...o,
                    selected: o.label === state.curYearSelection
                }))} onSelectionChanged={sel => {
                    //selected={ state.curYearSelection}
                    setState({
                        ...state,
                        curYearSelection: sel.label,
                    })
                    }} curDisplayValue={state.curYearSelection} setCurDisplayValue={year => {
                        setState(prev => {
                            const newState: IYearlyMaintenanceReportState = {
                                ...prev,
                                
                                curYearSelection: year,                                
                            }                            
                            return newState;
                        });
                    }}></EditTextDropdown>
            </div>
            <div className="col-sm-3">
                <EditTextDropdown items={state.curOwnerOptions.map(o => ({
                    ...o,
                    selected: o.label === state.curSelectedOwner
                }))} onSelectionChanged={sel => {
                    //selected={state.curSelectedOwner} 
                    setState({
                        ...state,
                        curSelectedOwner: sel.label,
                    })
                    }} curDisplayValue={state.curSelectedOwner} setCurDisplayValue={own => {
                        setState(prev => {
                            const newState: IYearlyMaintenanceReportState = {
                                ...prev,

                                curSelectedOwner: own,
                            }
                            return newState;
                        });
                }}></EditTextDropdown></div>
            <div className="col-sm-2">
                {
                    state.exportData.length ? <CreateSaveButton content={DoubleAryToCsv(state.exportData)} />:''
                }
            </div>
            <div className="col-sm-2">
                <button className="btn btn-primary" onClick={()=>getData()} >Reload</button>
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
                        showDetail ? <CreateSaveButton content={showDetail.details.map(d => `${d.amount.toFixed(2)},${d.date},${d.address},${d.notes},${d.debugText}`).join('\n')}  />:''
                    }
                </div>
            <table>
                {
                    sortBy((showDetail?.details || [] as IShowDetailsData[]), 'date').map((d,tri) => {
                        return <tr key={tri}><td>{d.amount.toFixed(2)}</td><td>{d.date}</td> <td>{d.address}</td><td> {d.notes}</td> <td>{d.debugText}</td></tr>
                    })

                }
                </table>
                {
                    showDetail?.export1099 && <button className="btn btn-primary" onClick={() => export1099(showDetail, showProgress).then(() => setShowDetail(null))}>Export 1099</button>
                }
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
    const { curYearSelection } = state;
    if (!curYearSelection) return;
    const m = moment(curYearSelection, 'YYYY');
    console.log(`data for ${curYearSelection} is `);
    console.log(m.toDate().toISOString());
    const startDate = m.format('YYYY-MM-DD');
    const endDate = m.add(1, 'year').startOf('year').format('YYYY-MM-DD');
    console.log(`star= ${startDate} end=${endDate}`)
    const rawData = state.allRawData.filter(d => {
        const ownerID = state.houseToOwnerMap[d.houseID];
        if (ownerID) {
            if (ownerID !== state.curSelectedOwner) return false;
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
            if (ownerId !== state.curSelectedOwner) {
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


async function get1099Content(parms: IDetailParams, showProgress?: (txt: string) => void) {
    if (!showProgress) showProgress = () => { };
    showProgress('loading workers');
    const workers = await getWorkerInfo();
    const founds = workers.filter(w => w.workerName.toLowerCase().trim() === parms.workerName.toLowerCase().trim());
    if (founds.length > 1) {
        showProgress('Found multiple workers '+parms.workerName);
        return;
    }
    if (founds.length === 0) {
        showProgress('worker not found ' + parms.workerName);
        return;
    }

    const owners = await getOwnerInfo();
    const ownersFound = owners.filter(w => w.ownerName.toLowerCase().trim() === parms.ownerName.toLowerCase().trim());
    if (ownersFound.length > 1) {
        showProgress('Found multiple owners ' + parms.ownerName);
        return;
    }
    if (ownersFound.length === 0) {
        showProgress('Owner not found ' + parms.ownerName);
        return;
    }

    const worker = founds[0];
    const owner = ownersFound[0];
    showProgress('worker found ' + parms.workerName);
    const irsfile = await doPost('misc/statement/1099', {}, 'GET');
    const resultData = write1099PdfFields({
        otherIncome: parms.total.toFixed(2),
        calendarYear: parms.YYYY,
        payer: {
            tin: owner.taxID,
            address: owner.address,
            city: owner.city,
            name: owner.taxName || owner.ownerName,
            phone: owner.phone,
            state: owner.state,
            zip: owner.zip,
        },
        receipient: {
            cityStateZip: `${worker.city} ${worker.state} ${worker.zip}`,
            name: worker.taxName || worker.workerName,
            street: worker.address,
            tin: worker.taxID,
        },
    }, await irsfile);
    return resultData;
}

async function export1099(parms: IDetailParams, showProgress?: (txt: string) => void) {
    const rawData = await get1099Content(parms, showProgress);
    if (!rawData) return;
    const blob = new Blob([rawData], {
        type: 'application/pdf'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `1099-${parms.YYYY}-${parms.ownerName}-${parms.workerName}.pdf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}



type Form1099Info = {
    otherIncome: string;
    calendarYear: string;
    payer: {
        tin: string;
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
    };
    receipient: {
        tin: string;
        name: string;
        street: string;
        cityStateZip: string
    };

}
async function write1099PdfFields(formData: Form1099Info, existingPdfBytes: ArrayBuffer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        if (type === 'PDFTextField') {
            const ff = form.getTextField(name);
            const len = ff.getMaxLength() || 10000;
            const matched = name.match(/f([0-9]+)_([0-9]+)/);
            let w = '';
            if (matched) {
                const fieldCount = matched[2];
                switch (fieldCount) {
                    case '2':
                        w = `${formData.payer.address}\n${formData.payer.city}\n${formData.payer.state} ${formData.payer.zip}\n${formData.payer.phone}`;
                        break;
                    case '3':
                        w = formData.payer.tin;
                        break;
                    case '4':
                        w = formData.receipient.tin;
                        break;
                    case '5':
                        w = formData.receipient.name;
                        break;
                    case '6':
                        w = formData.receipient.street;
                        break;
                    case '7':
                        w = formData.receipient.cityStateZip;
                        break;
                    case '11':
                        w = formData.otherIncome;
                        break;
                    case '1':
                        w = formData.calendarYear;
                        break;
                }
            }    
            if (w) {
                ff.setText(w);
            }
        }
    });
    const bytes = await pdfDoc.save();
    return bytes;
}