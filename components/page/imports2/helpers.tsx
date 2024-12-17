
import {
    IPageStates, IPageParms, IDbSaveData, ISheetRowData, IDbRowMatchData, IRowComparer,
    IDbInserter} from './types'

import { matchItems, loadPageSheetDataRaw, stdProcessSheetData, getHouseState } from './utils'
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

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
        dbData = await page.dbLoader();
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