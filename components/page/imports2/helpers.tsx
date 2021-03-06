
import {
    IPageInfo, IStringDict, ICompRowData, IPageStates, IPageParms, IPageDataDetails, IDbSaveData, ISheetRowData, IDbRowMatchData, IRowComparer,
    IDbInserter} from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { keyBy, xor } from 'lodash'
import moment from 'moment';
import { ALLFieldNames, getHouseByAddress } from '../imports2/types';
import * as lutil from './loads/util';
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

async function loadPageSheetDataRaw(sheetId: string, curPage: IPageInfo): Promise<IPageDataDetails> {
    if (!curPage) return;
    
    return googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r) => {
        if (!r || !r.values || !r.values.length) {
            console.log(`no data for ${curPage.pageName}`);
            return null;
        }
        
        const colNames: IStringDict = curPage.fieldMap.reduce((acc, f, ind) => {
            if (f) {
                acc[f] = r.values[0][ind];
            }
            return acc;
        }, {});
        const dataRows: ISheetRowData[] = r.values.slice(1).map(rr => {
            const importSheetData = curPage.fieldMap.reduce((acc, f, ind) => {
                if (f) {
                    acc[f] = rr[ind];
                }
                return acc;
            }, {} as IStringDict);
            return {
                matchRes: 'NA',
                needUpdate: true,
                saveData: null,
                dataType: 'Sheet',
                invalid: '',
                matchToKey: '',
                importSheetData,
                matched: null,
                matcherName: '',
                displayData: {},
            } as ISheetRowData;
        }).filter(x => x.importSheetData[curPage.sheetMustExistField]);
        return {
            colNames,
            dataRows,
        } as IPageDataDetails;   
    }).catch(err => {
        console.log(err);
        throw err;
    });
}

export async function createEntity(params: IPageParms, changeRow: ISheetRowData, inserter: IDbInserter) {
    //const state = curPageState;
    const dispatchCurPageState = params.dispatchCurPageState;
    //const changeRow = state.pageDetails.dataRows[rowInd] as ISheetRowData;
    const saveData = changeRow.importSheetData;    
    if (changeRow.invalid) {
        console.log(`invalid payment, don't create ${changeRow.invalid}`);
        return;
    }
    if (!changeRow.needUpdate) {
        console.log(`up-to-date entity ${changeRow.needUpdate}`);
        return;
    }
    changeRow.needUpdate = false;
    //sqlAdd('rentPaymentInfo',
    //    saveData, true
    //).
    return inserter.createEntity(saveData).then(res => {
        console.log('sql add owner');
        console.log(res);
        dispatchCurPageState(state => {
            return {
                ...state,
                //stateReloaded: ++state.stateReloaded,
                pageDetails: {
                    ...state.pageDetails,
                }
            }
        })
    }).catch(err => {
        console.log('sql add owner err');
        console.log(err)
        params.setErrorStr(`sql add rentpayment error ${err.message}`);
    })    
}


export async function getHouseState() {
    const hi = await getHouseInfo();
    return {
        houses: hi,
        housesByAddress: keyBy(hi, h => lutil.getStdLowerName(h.address)),
        housesById: keyBy(hi, h => h.houseID),
    }
}

export async function genericPageLoader(prms: IPageParms, pageState: IPageStates) {
    const sheetId = pageState.sheetId;
    const page = pageState.curPage;
    if (!sheetId) {
        console.log('no sheet id, return');
        return;
    }
    const pageDetails = await loadPageSheetDataRaw(sheetId, page);
    pageState.pageDetails = pageDetails;
    let hi = {};
    if (!pageState.houses) {
        //const hi = await getHouseInfo();
        hi = await getHouseState();
    }
    let dbData: IDbSaveData[] = [];
    if (page.dbLoader) {
        dbData = await page.dbLoader(pageState.selectedOwners);
    }    
    
    let extraProcessSheetData: (pg: ISheetRowData[], pageState: IPageStates) => Promise<ISheetRowData[]> = pageState.curPage.extraProcessSheetData || ((x, _) => Promise.resolve(x));
    pageState.sheetId = sheetId;
    const sheetDatas = await extraProcessSheetData(pageDetails.dataRows as ISheetRowData[], pageState);
    pageDetails.dataRows = sheetDatas;
    const displayData = stdProcessSheetData(sheetDatas, {
        ...pageState,
        ...hi,
    });

    let dbMatchData: IDbRowMatchData[] = null;
    if (page.rowComparers) {
        dbMatchData = dbData.map(dbItemData => {
            return {
                dbItemData,
                dataType: 'DB',
                matchedToKey: null,
            } as IDbRowMatchData;
        });
        page.rowComparers.forEach(cmp => {
            matchItems(sheetDatas, dbMatchData, cmp);
            sheetDatas.forEach(dd => {
                if (!cmp.checkRowValid) return;
                const err = cmp.checkRowValid(dd.importSheetData);
                if (!dd.invalid && err) {
                    dd.invalid = err;
                }
            })
        });
    }
    pageDetails.dbMatchData = dbMatchData;
    stdProcessSheetData(dbMatchData, {
        ...pageState,
        ...hi,
    })
    //console.log("dbData and sheetDatas", dbData, sheetDatas)
    if (prms) prms.dispatchCurPageState(state => {
        return {
            ...state,
            pageDetails,
            //houses: hi,
            //housesByAddress: keyBy(hi, 'address'),
            ...hi,
        }
    });
    return pageDetails;
}

//return true if not totally fixed
function matchItems(sheetData: ISheetRowData[], dbMatchData: IDbRowMatchData[], cmp: IRowComparer): boolean {    
    const dbDataKeyed = dbMatchData.reduce((acc, d) => {
        const key = cmp.getRowKey(d.dbItemData, 'DB');
        let cont = acc[key];
        if (!cont) {
            cont = [];
            acc[key] = cont;
        }
        cont.push(d);
        return acc;
    }, {} as {
        [key: string]: IDbRowMatchData[];
    });
    
    sheetData.map(sd => {        
        const key = cmp.getRowKey(sd.importSheetData, 'Sheet');    
        const matchedAll = dbDataKeyed[key];
        if (matchedAll && matchedAll.length) {
            const matched = matchedAll.find(m => !m.matchedToKey);
            if (matched) {
                sd.matchToKey = key;
                sd.matched = matched.dbItemData;
                sd.matcherName = cmp.name;
                sd.needUpdate = false;
                matched.matchedToKey = key;                
            }
        }
        return sd;
    });
    return !!sheetData.find(d => !d.matched);
}


function stdDisplayField(fieldNames: ALLFieldNames[], obj: IStringDict, pageState: IPageStates) : IStringDict {
    return fieldNames.reduce((acc, fieldName) => {
        let dsp = obj[fieldName];
        if (dsp === 0) {
            acc[fieldName] = dsp;
            return acc;
        }
        if (dsp === null || dsp === undefined) {
            acc[fieldName] = '';
            return acc;
        }
        if (!dsp && dsp !== '') return acc;
        switch (fieldName) {
            case 'date':
            case 'receivedDate':
            case 'startDate':
                const mmt = moment(dsp);
                if (mmt.isValid())
                    dsp = mmt.format('YYYY-MM-DD');
                else
                    dsp = `Invalid(${dsp})`;
                break;
            case 'monthlyRent':
            case 'deposit':
            case 'receivedAmount':
            case 'petDeposit':
            case 'amount':
                if (typeof dsp === 'number') dsp = dsp.toFixed(2);
                else dsp = parseFloat(dsp || '0').toFixed(2);
                break;
            case 'houseID':
                break;
            case 'ownerName':
                break;
        }
        acc[fieldName] = dsp;
        return acc;
    }, {});
}


function stdProcessSheetData(sheetData: ICompRowData[], pageState: IPageStates) : IStringDict[] {
    const fieldNames = pageState.curPage.fieldMap.filter(f => f);
    return sheetData.map(sd => {
        const acc = (sd as ISheetRowData).importSheetData || (sd as IDbRowMatchData).dbItemData;        
        fieldNames.forEach(fieldName => {            
            let v = acc[fieldName];
            switch (fieldName) {
                case 'address':
                    if (!v) {
                        if (!acc['houseID']) {
                            sd.invalid = 'house';
                            acc.invalidDesc = 'house';
                        } else {
                            const house = pageState.housesById[acc['houseID']];
                            if (house) {
                                acc[fieldName] = house.address;
                            } else {
                                acc[fieldName] = `${v} Unable to match house`;
                            }
                        }
                        break;
                    }
                    const house = getHouseByAddress(pageState, v as string);                    
                    if (house) {
                        acc['houseID'] = house.houseID;
                        acc['ownerID'] = house.ownerID;
                    } else {
                        acc['houseID'] = null;
                        //acc[fieldName] = `Invalid(${v})`;
                        sd.invalid = 'house';
                        acc.invalidDesc = 'house';
                    }
                    break;
                case 'receivedAmount':
                case 'monthlyRent':
                case 'deposit':
                case 'petDeposit':
                case 'otherDeposit':
                case 'amount':
                    if (v === null || v === undefined) {
                        acc[fieldName] = 'invalid(null)';
                        sd.invalid = fieldName;
                        acc.invalidDesc = `${fieldName} Invalid(null)`;
                    }
                    if (typeof v === 'string') {
                        v = v.replace(/[\$, ]/g, '').trim();
                        const neg = v.match(/\(([0-9]+(.[0-9]*){0,1}){1}\)/);
                        if (neg) {
                            v = '-'+neg[1];
                        }
                        v = parseFloat(v);
                    }
                    if (v === NaN || !v) v = 0;
                    acc[fieldName] = v;
                    break;
                case 'receivedDate':
                case 'date':
                case 'startDate':
                case 'endDate':
                    const mt = moment(v);
                    if (!mt.isValid()) {
                        sd.invalid = fieldName;                        
                        acc.invalidDesc = `bad date ${fieldName}:${v}`;
                    } else {
                        const dateStr = mt.format('YYYY-MM-DD');
                        acc[fieldName] = dateStr;
                    }
                    break;
                case 'tenant':
                    acc[fieldName] = v;
                    break;
                case 'comment':
                    acc[fieldName] = v || '';
                    break;
            }
        });
        const displayData = stdDisplayField(fieldNames, { ...acc }, pageState);
        sd.displayData = displayData;
        return displayData;
    });   
}

export function getDisplayHeaders(params: IPageParms, curPageState: IPageStates) {
    
    return curPageState.curPage && curPageState.curPage.displayColumnInfo && curPageState.curPage.displayColumnInfo.map((colInfo, key) => {
        const fieldName = colInfo.field;
        let dspVal = colInfo.name;
        const inserter = curPageState.curPage.dbInserter;
        const insertBtnCheck = curPageState.curPage.shouldShowCreateButton;
        if (inserter && insertBtnCheck) {
            if (insertBtnCheck(colInfo)) {
                return <>{ dspVal} <button className='btn btn-primary' onClick={async () => {
                    let processedCount = 0, updatedCount = 0;
                    for (let i = 0; i < curPageState.pageDetails.dataRows.length; i++) {
                        const curRow = curPageState.pageDetails.dataRows[i];
                        processedCount++;                       
                        params.showProgress(`processing ${i}/${curPageState.pageDetails.dataRows.length} updated=${updatedCount}`);
                        if (curRow.dataType === 'Sheet') {
                            const sheetRow = curRow as ISheetRowData;
                            if (!sheetRow.needUpdate) {
                                continue;
                            }
                            updatedCount++;
                            try {       
                                let err = null;
                                if (curPageState.curPage.rowComparers) {
                                    curPageState.curPage.rowComparers.forEach(rc => {
                                        if (!rc.checkRowValid) return;
                                        err = err || rc.checkRowValid(sheetRow.importSheetData);
                                    })
                                }
                                if (!err)
                                    await createEntity(params, sheetRow, inserter);
                                else {
                                    console.log('Found error during process all for page',err);    
                                    params.setErrorStr(err);
                                    //break;
                                }
                            } catch (err) {
                                const errStr = `Error createViaInserter ${inserter.name} ${err.message}`;
                                console.log(errStr);
                                console.log(err);
                                params.showProgress('');
                                params.setErrorStr(errStr);
                                break;
                            }
                        }
                    }
                    //reloadPayments(params);
                    if (curPageState.curPage.reloadEntity) curPageState.curPage.reloadEntity(params);
                    params.showProgress('done');
                }}>Process All</button></>
            }
        }
        return <td key={key}>{            
            dspVal
        }</td>
    })
            
}