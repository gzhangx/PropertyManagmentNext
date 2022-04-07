import React, { useState, useEffect, useReducer } from 'react';
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo, IHouseInfo, IPayment } from '../../reportTypes';
import { keyBy, mapValues, omit } from 'lodash'
import { InforDialog, GetInfoDialogHelper } from '../../generic/basedialog';
import moment from 'moment';

import { BaseDialog } from '../../generic/basedialog'
import { ALLFieldNames, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from './types'
import { loadPageSheetDataRaw } from './helpers'
import { getPageDefs } from './pageDefs'


export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    
    const [errorStr, setErrorStr] = useState('');
    //const [progressStr, setProgressStr] = useState('');
    const progressDlg = GetInfoDialogHelper();

    const [curPageState, dispatchCurPageState] = useReducer((state: IPageStates, act: (state: IPageStates) => IPageStates) => act(state) as IPageStates, {
        stateReloaded: 0,
        housesByAddress: {},
        //paymentsByDateEct: {},
        getHouseByAddress: (state, addr) => {
            return state.housesByAddress[addr.toLowerCase()]
        },
    } as IPageStates);

    

    

    const refreshOwners = () => {
        return getOwners().then(own => {
            dispatchCurPageState(state => {
                return {
                    ...state,
                    existingOwnersById: keyBy(own, 'ownerID'),
                    existingOwnersByName: keyBy(own, 'ownerName'),
                };
            });
        });
    }

    useEffect(() => {
        refreshOwners();
    }, []);


    

    useEffect(() => {
        if (!curPageState.curPage) return;
        loadPageSheetDataRaw(curPageState.curPage).then((pageDetails) => {
            if (curPageState.curPage.pageLoader) {
                curPageState.curPage.pageLoader({
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
        })
    }, [curPageState.stateReloaded, curPageState.curPage, curPageState.existingOwnersByName])
        

    const pages = getPageDefs({
        dispatchCurPageState,
        refreshOwners,
        setDlgContent,
        setErrorStr,
        showProgress: msg => progressDlg.setDialogText(msg),
    })
    console.log(`curPageState.stateReloaded=${curPageState.stateReloaded}`);



    
    return <div className="container-fluid">
        <BaseDialog children={dlgContent} show={dlgContent != null} />
        {
            errorStr && <InforDialog message={errorStr} hide={() => setErrorStr('')}></InforDialog>
        }
        {
            //progressStr && <InforDialog message={progressStr} hide={() => setProgressStr('')}></InforDialog>
        }
        {
            progressDlg.dialogText && progressDlg.Dialog
        }
        <div className="d-sm-flex align-items-center justify-content-between mb-4">        
            <div className="col-xl-3 col-md-6 mb-4">
                <div className="card shadow h-100 py-2 border-left-primary">
                    <div className="card-body">
                        <div className="row no-gutters align-items-center">
                            <div className="col mr-2">
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
                                return <td key={key}>{d}</td>
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
                                        curPageState.curPage.displayItem ? curPageState.curPage.displayItem(curPageState, key, p[key], p, ind) : (p[key] && p[key].val)
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