import React, { useState, useEffect, useReducer, type JSX } from 'react';
import { getTenants, saveGoodSheetAuthInfo, } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IIncomeExpensesContextValue, IPageRelatedState } from '../../reportTypes';
import { keyBy,  } from 'lodash'
import { GetInfoDialogHelper } from '../../generic/basedialog';
import { useRouter } from 'next/router'

import { BaseDialog } from '../../generic/basedialog'
import {  IPageStates, IStringDict, IPageParms, ISheetRowData, IDisplayColumnInfo, IPageInfo, IDbInserter } from './types'
import { genericPageLoader, getDeleteExtraFromDbItems, getDisplayHeaders, getMappingColumnInfo, updateRowData } from './helpers'
import { getPageDefs } from './pageDefs'

import { useIncomeExpensesContext } from '../../states/PaymentExpenseState'

import { sortBy } from 'lodash';
import { getTableModel } from '../../uidatahelpers/datahelpers';
import { IDBFieldDef } from '../../types';
import { ALLFieldNames } from '../../uidatahelpers/datahelperTypes';
import { usePageRelatedContext } from '../../states/PageRelatedState';

function getSheetId(mainCtx: IPageRelatedState) : string {
    return mainCtx.googleSheetAuthInfo.googleSheetId;
}


export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    const router = useRouter();
    const [reloads, setReloads] = useState({
        reloadUsers: 0,
    });
    //const [progressStr, setProgressStr] = useState('');
    const errorDlg = GetInfoDialogHelper();
    const progressDlg = GetInfoDialogHelper();

    const [curPageState, dispatchCurPageState] = useReducer((state: IPageStates, act: (state: IPageStates) => IPageStates) => act(state) as IPageStates, {
        stateReloaded: 0,
        housesByAddress: {},
        //paymentsByDateEct: {},
        showMatchedItems: false,
    } as IPageStates);
    
    const mainCtx = usePageRelatedContext();
    const { googleSheetAuthInfo, setGoogleSheetAuthinfo, reloadGoogleSheetAuthInfo } = mainCtx;
    const sheetId = getSheetId(mainCtx);

    //rootCtx.userInfo.
    //let sheetId = mainCtx.allOwners

    const refreshTenants = () => {
        return getTenants().then(tenants => {
            dispatchCurPageState(state => {
                return {
                    ...state, 
                    tenants,
                    tenantByName: keyBy(tenants,t=>t.fullName),
                    stateReloaded: state.stateReloaded+1,
                };
            });            
        });
    }

    useEffect(() => {
        refreshTenants();
    }, [reloads.reloadUsers]);


    

    const pagePrms: IPageParms = {
        dispatchCurPageState,
        refreshTenants,
        setDlgContent,
        setErrorStr: errorDlg.setDialogText,
        showProgress: msg => progressDlg.setDialogText(msg),
    };
    
    useEffect(() => {
        if (!curPageState.curPage) return;
        console.log("genericPageLoader loading", sheetId)
        curPageState.sheetId = sheetId;
        genericPageLoader(pagePrms, curPageState).catch(err => {
            const errStr = err.error || err.message;
            console.log('genericPageLoaderError',err)
            errorDlg.setDialogAction(errStr, () => {
                if (errStr && errStr.indexOf('authorization') >= 0) {
                    router.push('/Login')
                }
            })
        })
    }, [sheetId, curPageState.curPage, curPageState.stateReloaded])
    //curPageState.payments curPageState.stateReloaded,, curPageState.existingOwnersByName,
        
    const pages = getPageDefs();
    console.log(`curPageState.stateReloaded=${curPageState.stateReloaded}`);

    
    errorDlg.getDialog.bind(errorDlg);
    progressDlg.getDialog.bind(progressDlg);
    errorDlg.getDialog()
    
    return <div className="container-fluid">
        <BaseDialog children={dlgContent} show={dlgContent != null} />        
        {
            errorDlg.getDialog()
        }
        {
            progressDlg.getDialog()
        }
        <div className="d-sm-flex align-items-center justify-content-between mb-4">        
            <div className="col-xl-6 col-md-6 mb-6">
                <div className="card shadow h-100 py-2 border-left-primary">
                    <div className="card-body">
                        <div className="row no-gutters align-items-center">
                            <div className="col">
                                <div className="text-xs font-weight-bold text-uppercase mb-1 text-primary">Developer Options</div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                    <EditTextDropdown items={pages.map(p => {
                                        return {
                                            label: p.sheetMapping.sheetName,
                                            value: p,
                                            selected: p.sheetMapping.sheetName === 'House Info'
                                        }
                                    })
                                    }
                                        onSelectionChanged={async sel => {
                                            if (sel) {
                                                const pg: IPageInfo = sel.value;
                                                let fieldDefs: IDBFieldDef[] = [];
                                                let curPage: IPageInfo = {
                                                    ...sel.value,
                                                }
                                                if (pg) {
                                                    fieldDefs = await getTableModel(mainCtx, pg.table);
                                                    curPage.allFields = fieldDefs;
                                                    if (!curPage.displayColumnInfo) {
                                                        curPage.displayColumnInfo = curPage.sheetMapping.mapping.map(mapName => {
                                                            const found = fieldDefs.find(f => f.field === mapName);
                                                            if (!found) {
                                                                console.log(`Cant find column ${mapName}`);
                                                            }
                                                            return found;
                                                        }).filter(x=>x).map(f => {
                                                            return {
                                                                ...f,
                                                                field: f.field as ALLFieldNames,
                                                                name: f.name || '',
                                                            };
                                                        })
                                                    }
                                                }
                                                dispatchCurPageState(state => {
                                                    return {
                                                        ...state,
                                                        curPage: {
                                                            ...curPage
                                                        }
                                                    }
                                                })
                                            }
                                        }}
                                    ></EditTextDropdown>
                                </div>
                            </div>
                            <div className="col">
                                <button className='btn btn-primary' onClick={() => {
                                    setReloads({
                                        ...reloads,
                                        reloadUsers: ++reloads.reloadUsers,
                                    });
                                }}>Reload Users</button>
                            </div>
                            <div className="col-auto">
                                <i className="fas fa-calendar fa-2x text-gray-300 fa - calendar" onClick={() => {
                                    dispatchCurPageState(state => ({
                                        ...state,
                                        showMatchedItems: !state.showMatchedItems,
                                    }))
                                }}>{ curPageState.showMatchedItems?'R':'' }</i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            
        </div>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">        
            <div className="col-xl-6 col-md-6 mb-6">
                <div className="card shadow h-100 py-2 border-left-primary">
                    <div className="card-body">
                        <div className="card-body">
                            <div className="row no-gutters align-items-center">
                                <div className="col col-xl-2">
                                      GSheet Id
                                </div>
                                <div className="col col-xl-6">
                                    <input type='text' value={googleSheetAuthInfo.googleSheetId || 'NA'} style={{ width: '420px' }}
                                        onChange={e => {
                                            console.log(e.target.value);
                                            setGoogleSheetAuthinfo({
                                                ...googleSheetAuthInfo,
                                                googleSheetId: e.target.value,
                                            })
                                        }}></input>
                                </div>
                            </div>
                            <div className="row no-gutters align-items-center">
                                <div className="col col-xl-2">
                                    PrivateKey
                                </div>
                                <div className="col col-xl-6">
                                    <input type='text' value={googleSheetAuthInfo.private_key || 'NA'} style={{ width: '420px' }}
                                        onChange={e => {
                                            setGoogleSheetAuthinfo({
                                                ...googleSheetAuthInfo,
                                                private_key: e.target.value,
                                            })
                                        }}></input>
                                </div>
                            </div>
                            <div className="row no-gutters align-items-center">
                                <div className="col col-xl-2">
                                    PrivateKey Id
                                </div>
                                <div className="col col-xl-6">
                                    <input type='text' value={googleSheetAuthInfo.private_key_id || 'NA'} style={{ width: '420px' }}
                                        onChange={e => {
                                            setGoogleSheetAuthinfo({
                                                ...googleSheetAuthInfo,
                                                private_key_id: e.target.value,
                                            })
                                        }}></input>
                                </div>
                            </div>
                            <div className="row no-gutters align-items-center">
                                <div className="col col-xl-2">
                                    client_email
                                </div>
                                <div className="col col-xl-6">
                                    <input type='text' value={googleSheetAuthInfo.client_email || 'NA'} style={{ width: '420px' }}
                                        onChange={e => {
                                            setGoogleSheetAuthinfo({
                                                ...googleSheetAuthInfo,
                                                client_email: e.target.value,
                                            })
                                        }}></input>
                                </div>
                            </div>
                            <div className="row no-gutters align-items-center">
                                <div className="col col-xl-2">
                                    <button className='btn btn-primary' onClick={async () => {
                                        await saveGoodSheetAuthInfo(googleSheetAuthInfo);
                                    }} >Save</button>
                                </div>                                
                                <div className="col col-xl-2">
                                    <button className='btn btn-primary' onClick={async () => {
                                        reloadGoogleSheetAuthInfo();
                                    }} >Load</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="row">
            <table className='table'>
                <thead>
                    <tr>
                        {
                            getDisplayHeaders(pagePrms, curPageState)
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        displayItems(pagePrms, curPageState)
                    }
                    <tr><td>DB Extras</td></tr>
                    {
                        displayExtraDbItems(pagePrms, curPageState)
                    }
                </tbody>
            </table>
            
        </div>
    </div>
}


function stdTryDisplayItemForCreate(params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, dc: IDisplayColumnInfo,
    belongsToOwnerCheck: (data:IStringDict)=>boolean
): JSX.Element {
    const field: ALLFieldNames = dc.field;
    const showCreateBtn = state.curPage.showCreateButtonColumn === dc.field;
    
    //const dbInserter: IDbInserter = inserter.getDbInserter(state.curPage.table, true);
    const belongsToOwner = belongsToOwnerCheck(sheetRow.importSheetData);
    if (showCreateBtn && !sheetRow.invalid && belongsToOwner) {
        const itemVal = sheetRow.displayData[field];
        let invalidInfo = '';
        if (!sheetRow.needUpdate) invalidInfo = 'No Need to update ';
        if (sheetRow.invalid) invalidInfo += ' Invalid: ' + sheetRow.invalid; 
        if (sheetRow.sheetDataInvalidDontShowReason) invalidInfo += sheetRow.sheetDataInvalidDontShowReason;
        return <button disabled={!sheetRow.needUpdate || !!sheetRow.invalid} onClick={async () => {
            //setProgressStr('processing')
            if (sheetRow.invalid || !sheetRow.needUpdate) return;
            params.showProgress('processing');            
            await updateRowData(params, state.curPage.table, sheetRow, sheetRow.matchedById?false:true)
            // try {
            //     await dbInserter.createEntity(sheetRow.importSheetData);
            //     sheetRow.needUpdate = false;
            //     params.dispatchCurPageState(state => ({
            //         ...state,
            //     }));
            //     params.showProgress('');
            // } catch (err) {
            //     const errStr = `Error create payment ${err.message}`;
            //     console.log(errStr);
            //     console.log(err);
            //     params.showProgress('');
            //     params.setErrorStr(errStr);
            // }
            //setDlgContent(createPaymentFunc(state, all, rowInd))

        }}> Click to create (field={ field} val={itemVal}) {invalidInfo} {sheetRow.sheetDataInvalidDontShowReason}</button>
    }
    if (sheetRow.invalid) {
        if (showCreateBtn) {
            return <div style={{ color: 'red' }}>{sheetRow.displayData[field]} ({ sheetRow.invalid})</div>    
        }
        return <div style={{ color: 'red' }}>{sheetRow.displayData[field]}</div>
    }
    return null;
}

function displayItems(pagePrms: IPageParms, curPageState: IPageStates) {
    if (!curPageState.pageDetails) return;
    
    const dspCi = curPageState.curPage.displayColumnInfo;

    
    const cmpSortField = curPageState.curPage.cmpSortField;
    const belongsToOwner = (data: IStringDict) =>{
        const dataOwner = data['ownerID'];
        if (dataOwner) {
            return true; //TODO add filtering
        }
        return true;
    }
    const sheetDsp = curPageState.pageDetails.dataRows
        .filter(x => (!x.sheetDataInvalidDontShowReason &&  (!x.matched || x.needUpdate || curPageState.showMatchedItems)) && belongsToOwner(x.importSheetData))
        .map((sheetRow, ind) => {
            const showItem = (dc: IDisplayColumnInfo) => {
                const field = dc.field;
                const dspRes = (stdTryDisplayItemForCreate(pagePrms, curPageState, sheetRow, dc, belongsToOwner) || sheetRow.displayData[field]);
                return dspRes;
            }
            return {
                sort: sheetRow.displayData[cmpSortField], dsp: <tr key={ind}>{
                    dspCi.map((dc, ck) => {
                        return <td key={ck}>{
                            showItem(dc)
                        }</td>
                    })
                }</tr>
            };
        });
    
    const combinedDsp = sortBy(sheetDsp, d => d.sort).map(d=>d.dsp);
    return combinedDsp;
}


function displayExtraDbItems(pagePrms: IPageParms, curPageState: IPageStates) {
    if (!curPageState.pageDetails) return;
    if (!curPageState.pageDetails.dbMatchData) return;

    const dspCi = getMappingColumnInfo(curPageState.curPage);//curPageState.curPage.displayColumnInfo;


    const cmpSortField = curPageState.curPage.cmpSortField;
    

    const deleteFuncs = getDeleteExtraFromDbItems(pagePrms, curPageState);
    const dbDsp = deleteFuncs.map(({
        dbRow,
        rowInd,
        deleteFunction,
    }) => {
            return {
                sort: dbRow.dbItemData[cmpSortField], dsp: <tr key={rowInd}>{                    
                    dspCi.map((dc, ck) => {
                        let dspVal: string | number | JSX.Element = 'DB-'+dbRow.dbItemData[dc.field];
                        //if (curPageState.curPage.deleteById) {                            
                            if (dc.field === curPageState.curPage.sheetMustExistField) {
                                dspVal = <div>
                                    <div>{dspVal}</div>
                                    <button onClick={deleteFunction}>Delete</button>
                                </div>
                            }
                        //}
                        return <td key={ck}>{
                            dspVal
                        }</td>
                    })
                }</tr>
            }
        })

    const combinedDsp = sortBy(dbDsp, d => d.sort).map(d => d.dsp);
    return combinedDsp;
}