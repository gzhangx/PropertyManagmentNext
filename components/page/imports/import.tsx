import React, { useState, useEffect, useReducer } from 'react';
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords, getTenants } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo, IHouseInfo, IPayment, IIncomeExpensesContextValue } from '../../reportTypes';
import { keyBy, mapValues, omit } from 'lodash'
import { InforDialog, GetInfoDialogHelper } from '../../generic/basedialog';
import moment from 'moment';
import { useRouter } from 'next/router'

import { BaseDialog } from '../../generic/basedialog'
import { ALLFieldNames, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from './types'
import { loadPageSheetDataRaw } from './helpers'
import { getPageDefs } from './pageDefs'

import { useIncomeExpensesContext } from '../../states/PaymentExpenseState'
import { IRootPageState, useRootPageContext } from '../../states/RootState'

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
        getHouseByAddress: (state, addr) => {
            return state.housesByAddress[addr.toLowerCase().trim()]
        },
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
                    stateReloaded: state.stateReloaded + 1,
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
    }, [reloads.reloadUsers]);


    

    const pagePrms = {
        pageState: curPageState,
        dispatchCurPageState,
        refreshOwners,
        setDlgContent,
        setErrorStr: errorDlg.setDialogText,
        showProgress: msg => progressDlg.setDialogText(msg),
    };
    useEffect(() => {
        if (!curPageState.curPage) return;
        loadPageSheetDataRaw(sheetId, curPageState.curPage).then((pageDetails) => {
            if (curPageState.curPage.pageLoader) {
                return curPageState.curPage.pageLoader(pagePrms, {
                    selectedOwners,
                    sheetId,
                    ...curPageState,
                    pageDetails,
                });
            } else {
                dispatchCurPageState(state => {
                    return {
                        ...state,
                        pageDetails,
                    }
                })
            }
        }).catch(err => {
            errorDlg.setDialogText(err.error || err.message);            
        })
    }, [sheetId, curPageState.stateReloaded, curPageState.curPage, curPageState.existingOwnersByName, curPageState.payments])
        

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
                            curPageState.pageDetails && curPageState.pageDetails.columns && curPageState.pageDetails.columns.map((d, key) => {
                                return <td key={key}>{
                                    curPageState.curPage.displayHeader? curPageState.curPage.displayHeader(pagePrms,curPageState, d, key) : d
                                }</td>
                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        curPageState.pageDetails && curPageState.pageDetails.rows.map((p, ind) => {
                            let keys = curPageState.curPage.fieldMap as string[];
                            if (!keys) {
                                keys = curPageState.pageDetails.columns.map((d, ind) => ind.toString());
                            } else {
                                keys = keys.filter(x => x);
                            }
                            return <tr key={ind}>{
                                keys.map((key, ck) => {
                                    return <td key={ck}>{
                                        curPageState.curPage.displayItem ? curPageState.curPage.displayItem(pagePrms,curPageState, key, p[key], p, ind) : (p[key] && p[key].val)
                                    }</td>
                                })
                            }</tr>
                        })
                    }
                </tbody>
            </table>
            
        </div>
    </div>
}