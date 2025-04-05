
import {
    IPageStates, IPageParms, IDbSaveData, ISheetRowData, IDbRowMatchData, IRowComparer,
    IDbInserter,
    IDisplayColumnInfo,
    IStringDict,
    IPageInfo} from './types'

import { matchItems, loadPageSheetDataRaw, stdProcessSheetData, getHouseState } from './utils'
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

import * as inserter from './loads/inserter';
import { deleteById } from '../../api';
import { IDBFieldDef, TableNames } from '../../types';
import { stdFormatValue } from '../../uidatahelpers/datahelpers';

export async function createEntity(params: IPageParms, changeRow: ISheetRowData, inserter: IDbInserter, fields: IDBFieldDef[]) {
    //const state = curPageState;
    const dispatchCurPageState = params.dispatchCurPageState;
    //const changeRow = state.pageDetails.dataRows[rowInd] as ISheetRowData;
    const saveData = {
        ...changeRow.importSheetData         
    };

    if (changeRow.invalid) {
        console.log(`invalid entity, don't create (${inserter.name}) invalid=${changeRow.invalid}`, saveData);
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
        console.log('sql add entity', inserter.name);
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
        console.log('sql add entity err',inserter.name);
        console.log(err)
        params.setErrorStr(`sql add entity error entity=${inserter.name} ${err.message}`);
    })    
}


export async function reloadHouses(prms: IPageParms, pageState: IPageStates) {
    const hi = await getHouseState();
    const res = { ...pageState, ...hi };
    prms.dispatchCurPageState(state => {
        return {
            ...state,            
            ...hi,
        }
    });
    return res;
}

export function getMappingColumnInfo(curPage: IPageInfo): IDBFieldDef[] {
    const mappingColumnInfo = curPage.sheetMapping.mapping.map(name => {
        return curPage.allFields.find(f => f.field === name);
    }).filter(x => x);
    return mappingColumnInfo;
}
export async function genericPageLoader(prms: IPageParms, pageState: IPageStates) {
    const sheetId = pageState.sheetId;
    const page = pageState.curPage;
    if (!page) {
        console.log('no page, return');
        return;
    }
    if (!sheetId || sheetId === 'NA') {
        console.log('no sheet id, return');
        return;
    }
    let hi = {};
    if (!pageState.houses) {
        //const hi = await getHouseInfo();
        hi = await getHouseState();
    }
    const pageDetails = await loadPageSheetDataRaw(sheetId, { ...pageState, ...hi });
    pageState.pageDetails = pageDetails;
    
    let dbData: IDbSaveData[] = [];
    if (page.dbLoader) {
        dbData = await page.dbLoader();
    }    
    
    //let extraProcessSheetData: (pg: ISheetRowData[], pageState: IPageStates) => Promise<ISheetRowData[]> = pageState.curPage.extraProcessSheetData || ((x, _) => Promise.resolve(x));
    pageState.sheetId = sheetId;
      
    for (const fd of pageState.curPage.allFields) {
        if (fd.foreignKey && fd.foreignKey.table) {
            await prms.pageCtx.loadForeignKeyLookup(fd.foreignKey.table);
        }
    }
    stdProcessSheetData(pageDetails.dataRows, {
        ...pageState,
        ...hi,
    }, prms.pageCtx, pageState.curPage.table === 'rentPaymentInfo');

    const mappingColumnInfo = getMappingColumnInfo(pageState.curPage);
    const rowComparer: IRowComparer =
    {
        name: 'Payment Row Comparer',
        getRowKey: (data: IDbSaveData, makeIdFieldNull: boolean, source: 'DB' | 'Sheet') => {
            const parts = mappingColumnInfo.map(fd => {
                if (fd.isId && makeIdFieldNull) {
                    return '';
                }
                switch (fd.type) {
                    case 'date':
                    case 'datetime':
                        //return YYYYMMDDFormater(data[fd.field] as string)
                    case 'decimal':
                        //return parseFloat(data[fd.field] as string).toFixed(2);
                        return stdFormatValue(fd, data[fd.field], fd.field, source=== 'DB'? prms.pageCtx: undefined).v;
                    default:
                        return (data[fd.field] as string || '').toString().trim();
                }
            })                        
            return parts.join('-');
        },
        getRowKeys: (data: IDbSaveData, source: 'DB' | 'Sheet') => {  //used for debug only
            const parts = mappingColumnInfo.map(fd => {
                switch (fd.type) {
                    case 'date':
                    case 'datetime':
                    //return YYYYMMDDFormater(data[fd.field] as string)
                    case 'decimal':
                        //return parseFloat(data[fd.field] as string).toFixed(2);
                        return stdFormatValue(fd, data[fd.field], fd.field, source === 'DB' ? prms.pageCtx : undefined).v as string;
                    default:
                        return (data[fd.field] as string || '').toString().trim();
                }
            })
            return parts;
        },
        getSheetInvalidValues: (data: IDbSaveData) => {
            const invalids: string[] = [];
            mappingColumnInfo.forEach(fd => {
                switch (fd.type) {
                    case 'date':
                    case 'datetime':
                    //return YYYYMMDDFormater(data[fd.field] as string)
                    case 'decimal':
                        //return parseFloat(data[fd.field] as string).toFixed(2);
                        const res = stdFormatValue(fd, data[fd.field], fd.field);
                        if (res.error) {
                            invalids.push(`${fd.field} '${data[fd.field]}' ${res.error}`)
                        }
                }
            })
            return invalids.join(',');
        }
    };
    
        //page.rowComparers.forEach(cmp => {
    const dbMatchData = matchItems(pageDetails, dbData, rowComparer);
        //});
    
    //pageDetails.dbMatchData = dbMatchData;
    stdProcessSheetData(dbMatchData, {
        ...pageState,
        ...hi,
    }, prms.pageCtx)
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


export function getDisplayHeaders(params: IPageParms, curPageState: IPageStates) {
    if (!curPageState.curPage) return null;
    const table = curPageState.curPage.table;
    if (!curPageState.curPage.displayColumnInfo) {
        curPageState.curPage.displayColumnInfo = curPageState.curPage.sheetMapping.mapping.map(fname => {
            const def = curPageState.curPage.allFields.find(f => f.field === fname);
            if (def.foreignKey && def.foreignKey.field === 'houseID') {
                return {
                    ...def,
                    field: 'address', //def.field as ALLFieldNames,
                    name: 'Address'
                };
            }
            return def as IDisplayColumnInfo;
        })
    }
    const dbInserter: IDbInserter = inserter.getDbInserter(params.pageCtx, table, true);
    const requiredFields = curPageState.curPage.allFields.filter(f => {
        return !f.isId && f.required && !f.userSecurityField;
    });
    const validRow = (importSheetData: IStringDict) => {
        const missingFields:string[] = [];
        requiredFields.forEach(f => {
            const v = importSheetData[f.field];
            if (!v) {
                if (v !== 0) missingFields.push(f.field);
            }
        });
        if (missingFields.length) {
            return `missing fields: ${missingFields.join(',')}`;
        }
        return '';
    }
    return  curPageState.curPage.displayColumnInfo.map((colInfo, key) => {
        const fieldName = colInfo.field;
        let dspVal = colInfo.name;
        const insertBtnCheck = curPageState.curPage.showCreateButtonColumn === colInfo.field;
        if (insertBtnCheck) {
            {
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
                                if (sheetRow.invalid) {
                                    console.log('invalid row in process all imports', sheetRow.invalid, sheetRow);
                                    continue;
                                }
                                const err = validRow(sheetRow.importSheetData);
                                console.log('createntity', err, sheetRow.invalid);                                   
                                if (!err)
                                    await createEntity(params, sheetRow, dbInserter, curPageState.curPage.allFields!);
                                else {
                                    console.log('Found error during process all for page',err, sheetRow);    
                                    params.setErrorStr(err);
                                    //break;
                                }
                            } catch (err) {
                                const errStr = `Error createViaInserter ${table} ${err.message}`;
                                console.log('stdProcess caught errStr', errStr);
                                console.log('stdProcess caught err',err);
                                params.showProgress('');
                                params.setErrorStr(errStr);
                                break;
                            }
                        }
                    }
                    //reloadPayments(params);
                    const deleteActions = getDeleteExtraFromDbItems(params, curPageState);
                    for (let i = 0; i < deleteActions.length; i++) {
                        const delAct = deleteActions[i];
                        params.showProgress(`processing deletes ${i}/${deleteActions.length}`);
                        await delAct.deleteFunction();
                    }
                    params.showProgress('done');
                }}>Process All Imports</button></>
            }
        }
        return <td key={key}>{            
            dspVal
        }</td>
    })
            
}


export async function updateRowData(params: IPageParms, table: TableNames, sheetRow: ISheetRowData, doCreate: boolean) {
    params.showProgress('processing');
    const dbInserter: IDbInserter = inserter.getDbInserter(params.pageCtx, table, doCreate);
    try {
        await dbInserter.createEntity(sheetRow.importSheetData);
        sheetRow.needUpdate = false;
        params.dispatchCurPageState(state => ({
            ...state,
        }));
        params.showProgress('');
    } catch (err) {
        const errStr = `Error create payment ${err.message}`;
        console.log(errStr);
        console.log(err);
        params.showProgress('');
        params.setErrorStr(errStr);
    }
}

type DeleteExtraDbItemRet = {
    deleteFunction: () => Promise<void>;
    dbRow: IDbRowMatchData;
    rowInd: number;
}
export function getDeleteExtraFromDbItems(pagePrms: IPageParms, curPageState: IPageStates): DeleteExtraDbItemRet[] {
    const emptyRes: DeleteExtraDbItemRet[] = [];
    if (!curPageState.pageDetails) return emptyRes;
    if (!curPageState.pageDetails.dbMatchData) return emptyRes;
    const deletedByIds = (ids: string[]) => deleteById(curPageState.curPage.table, ids);
    //const deleteById = curPageState.curPage.deleteById;    
    const idFields = curPageState.curPage.allFields?.filter(f => f.isId).map(f => f.field) || [];
    const dbMatchData: IDbRowMatchData[] = curPageState.pageDetails.dbMatchData.filter(x => x.dataType === 'DB');    
    return dbMatchData.filter(x => !x.matchedToKey && !x.dbExtraNotDeleteButUpdate).map((dbRow, rowInd) => {
        const deleteFunction = () => {
            //if (dbRow.dbExtraNotDeleteButUpdate) {
            //    return updateRowData(pagePrms, curPageState.curPage.table, dbRow.dbExtraNotDeleteButUpdate, false);
            //}
            //const idField = curPageState.curPage.dbItemIdField;
            //const id = dbRow.dbItemData[idField];
            const ids = idFields.map(f => dbRow.dbItemData[f] as string);
            return deletedByIds(ids).then(r => {
                console.log(`affected for ${ids.join(',')}`, r.affectedRows);
                pagePrms.dispatchCurPageState(state => ({
                    ...state,
                    pageDetails: {
                        ...state.pageDetails,
                        dbMatchData: state.pageDetails.dbMatchData.filter(x => idFields.map(f=>x.dbItemData[f]).join(',') !== ids.join(',')),
                    }
                }))
            })
        };
        return {
            deleteFunction,
            dbRow,
            rowInd,
        };
    });
}