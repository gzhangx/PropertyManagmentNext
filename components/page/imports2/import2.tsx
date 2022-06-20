import React, { useState, useEffect, useReducer } from 'react';
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords, getTenants } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo, IHouseInfo, IPayment, IIncomeExpensesContextValue } from '../../reportTypes';
import { keyBy, mapValues, omit } from 'lodash'
import { InforDialog, GetInfoDialogHelper } from '../../generic/basedialog';
import moment from 'moment';
import { useRouter } from 'next/router'

import { BaseDialog } from '../../generic/basedialog'
import { ALLFieldNames, IPaymentWithArg, IPageInfo, IPageStates, IStringDict, IPageParms, ISheetRowData, IDbRowMatchData, IDisplayColumnInfo } from './types'
import { genericPageLoader, getDisplayHeaders } from './helpers'
import { getPageDefs } from './pageDefs'

import { useIncomeExpensesContext } from '../../states/PaymentExpenseState'
import { IRootPageState, useRootPageContext } from '../../states/RootState'

import { sortBy } from 'lodash';

function getSheetId(rootCtx: IRootPageState, mainCtx: IIncomeExpensesContextValue) : string {
    const loginUserId = rootCtx.userInfo.id;
    const owner = mainCtx.allOwners.find(o => o.ownerID === loginUserId);    
    let sheetId = '';
    if (owner) {        
        sheetId = owner.googleSheetId;
    }
    const firstSelectedOwner = mainCtx.selectedOwners.find(o => o.googleSheetId)
    if (firstSelectedOwner) {
        sheetId = firstSelectedOwner.googleSheetId;
    }
    return sheetId;
}


export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    const router = useRouter();
    const [reloads, setReloads] = useState({
        reloadUsers: 0,        
    })
    //const [progressStr, setProgressStr] = useState('');
    const errorDlg = GetInfoDialogHelper();
    const progressDlg = GetInfoDialogHelper();

    const [curPageState, dispatchCurPageState] = useReducer((state: IPageStates, act: (state: IPageStates) => IPageStates) => act(state) as IPageStates, {
        stateReloaded: 0,
        housesByAddress: {},
        //paymentsByDateEct: {},
        
    } as IPageStates);

    const rootCtx = useRootPageContext();
    const mainCtx = useIncomeExpensesContext();
    const sheetId = getSheetId(rootCtx, mainCtx);
    const selectedOwners = mainCtx.selectedOwners;

    //rootCtx.userInfo.
    //let sheetId = mainCtx.allOwners
    const refreshOwners = () => {
        return getOwners().then(own => {
            dispatchCurPageState(state => {
                return {
                    ...state,
                    existingOwnersById: keyBy(own, 'ownerID'),
                    existingOwnersByName: keyBy(own, 'ownerName'),
                    //stateReloaded: state.stateReloaded + 1,
                };
            });
        }).catch(err => {
            errorDlg.setDialogText(err.error || err.message);            
        });
    }

    const refreshTenants = () => {
        return getTenants(selectedOwners).then(tenants => {
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
        refreshOwners();
        refreshTenants();
    }, [reloads.reloadUsers,selectedOwners]);


    

    const pagePrms: IPageParms = {
        dispatchCurPageState,
        refreshOwners,
        refreshTenants,
        setDlgContent,
        setErrorStr: errorDlg.setDialogText,
        showProgress: msg => progressDlg.setDialogText(msg),
    };
    
    useEffect(() => {
        if (!curPageState.curPage) return;
        console.log("genericPageLoader loading", sheetId)
        curPageState.sheetId = sheetId;
        curPageState.selectedOwners = selectedOwners;
        genericPageLoader(pagePrms, curPageState).catch(err => {
            const errStr = err.error || err.message;
            console.log('genericPageLoaderError',err)
            errorDlg.setDialogAction(errStr, () => {
                if (errStr && errStr.indexOf('authorization') >= 0) {
                    router.push('/Login')
                }
            })
        })
    }, [sheetId, selectedOwners, curPageState.curPage, curPageState.stateReloaded])
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
                                            label: p.pageName,
                                            value: p,
                                            selected: p.pageName === 'House Info'
                                        }
                                    })
                                    }
                                        onSelectionChanged={sel => {
                                            if (sel) {
                                                dispatchCurPageState(state => {
                                                    return {
                                                        ...state,
                                                        curPage: sel.value,
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
                                <i className="fas fa-calendar fa-2x text-gray-300 fa - calendar"></i>
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
    const showCreateBtn = state.curPage.shouldShowCreateButton && state.curPage.shouldShowCreateButton(dc);
    
    const belongsToOwner = belongsToOwnerCheck(sheetRow.importSheetData);
    if (state.curPage.dbInserter && showCreateBtn && !sheetRow.invalid && belongsToOwner) {
        const itemVal = sheetRow.displayData[field];
        return <button disabled={!sheetRow.needUpdate || !!sheetRow.invalid} onClick={async () => {
            //setProgressStr('processing')
            if (sheetRow.invalid || !sheetRow.needUpdate) return;
            params.showProgress('processing');
            try {
                await state.curPage.dbInserter.createEntity(sheetRow.importSheetData);
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
            //setDlgContent(createPaymentFunc(state, all, rowInd))

        }}> Click to create ${itemVal}</button>
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
    const selectedOwnersById = keyBy(curPageState.selectedOwners, 'ownerID');
    const belongsToOwner = (data: IStringDict) =>{
        const dataOwner = data['ownerID'];
        if (dataOwner) {
            return !!selectedOwnersById[dataOwner];
        }
        return true;
    }
    const sheetDsp = curPageState.pageDetails.dataRows
        .filter(x => !x.matched && belongsToOwner(x.importSheetData))
        .map((sheetRow, ind) => {
            const showItem = (dc: IDisplayColumnInfo) => {
                const field = dc.field;
                let dspRes = null;
                if (curPageState.curPage.displayItem)
                    dspRes = (curPageState.curPage.displayItem(pagePrms, curPageState, sheetRow, field));
                    
                if (!dspRes) {
                    dspRes = (stdTryDisplayItemForCreate(pagePrms, curPageState, sheetRow, dc, belongsToOwner) || sheetRow.displayData[field]);
                }
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
    const dspCi = curPageState.curPage.displayColumnInfo;


    const cmpSortField = curPageState.curPage.cmpSortField;

    const dbDsp = curPageState.pageDetails.dbMatchData.filter(x => x.dataType === 'DB').map(x => x as IDbRowMatchData)
        .filter(x => !x.matchedToKey).map((dbRow, ind) => {
            return {
                sort: dbRow.dbItemData[cmpSortField], dsp: <tr key={ind}>{                    
                    dspCi.map((dc, ck) => {
                        let dspVal: string | number | JSX.Element = 'DB-'+dbRow.dbItemData[dc.field];
                        if (curPageState.curPage.displayDbExtra) {
                            dspVal = curPageState.curPage.displayDbExtra(pagePrms, curPageState, dbRow, dc.field);
                        }
                        if (curPageState.curPage.deleteById) {
                            if (dc.field === curPageState.curPage.sheetMustExistField) {
                                dspVal = <div>
                                    <div>{dspVal}</div>
                                    <button onClick={() => {
                                        const idField = curPageState.curPage.dbItemIdField;
                                        const id = dbRow.dbItemData[idField];                                        
                                        curPageState.curPage.deleteById(id as string).then(r => {
                                            console.log(`affected for ${id}`, r.affectedRows);
                                            pagePrms.dispatchCurPageState(state => ({
                                                ...state,  
                                                pageDetails: {
                                                    ...state.pageDetails,
                                                    dbMatchData: state.pageDetails.dbMatchData.filter(x=>x.dbItemData[idField] !== id),
                                                }
                                            }))
                                        })
                                    }}>Delete</button>
                                </div>
                            }
                        }
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