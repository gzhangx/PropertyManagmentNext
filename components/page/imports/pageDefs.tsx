
import { IOwnerInfo, IHouseInfo, IPayment } from '../../reportTypes';
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { InforDialog, GetInfoDialogHelper } from '../../generic/basedialog';
import moment from 'moment'
import {keyBy, omit, mapValues} from 'lodash'
import React from 'react';
import { createPayment } from './helpers'

import * as loaders from './loads/lease'

function getPaymentKey(pmt: IPayment) {        
    const date = moment(pmt.receivedDate).format('YYYY-MM-DD')        
    const amt = pmt.receivedAmount.toFixed(2);
    return `${date}-${amt}-${pmt.houseID}-${pmt.paymentID || ''}-${(pmt.paymentTypeID || '').trim()}-${(pmt.notes || '').trim()}`;
}    

interface IPageDefPrms extends IBasicImportParams {
    //dispatchCurPageState: React.Dispatch<React.SetStateAction<IPageStates>>;
    //showProgress: (str: string) => void; //progressDlg.setDialogText('processing');
    //createHouse: (state: IPageStates, data: { [key: string]: IItemData }) => void;  //setDlgContent(createHouseFunc(state, all))
    //createOwner: () => void; //setDlgContent(createOwnerFunc(item.val))
    //hideDlg: () => void; //setDlgContent(null);
    refreshOwners: () => Promise<void>;
    setDlgContent: React.Dispatch<React.SetStateAction<JSX.Element>>;
    //setErrorStr: (str: string) => void;
}
export function getPageDefs(params: IPageDefPrms) {
    const { dispatchCurPageState } = params;
    async function getHouseState() {
        const hi = await getHouseInfo();        
        return {        
            houses: hi,
            housesByAddress: keyBy(hi, h=>h.address.toLowerCase()),
        }        
    }

    const pages: IPageInfo[] = [
        {
            pageName: 'Tenants Info',
            range: 'A1:G',
        },
        {
            pageName: 'Lease Info',
            range: 'A1:M',
        },
        {
            pageName: 'PaymentRecord',
            range: 'A1:F',
            fieldMap:[
                'receivedDate',
                'receivedAmount',
                'houseID',
                'paymentTypeID',
                'paymentProcessor',                
                //'paidBy',
                'notes',
                //'created',
                //'modified',                
                //'month',                
                //'ownerID',
            ],
            idField: 'receivedDate',
            pageLoader: async (pageState: IPageStates) => {
                const page = pageState.curPage;
                const pageDetails = pageState.pageDetails;
                let hinfo = {} as {
                    [key: string]: any;
                };
                let payments = pageState.payments;                
                if (!pageState.payments || pageState.reloadPayments) {
                    const hi = await getPaymentRecords();
                    payments = hi.map(h => ({ ...h, processed: false }));
                    hinfo = {
                        payments,
                    }
                }
                if (!pageState.houses) {                    
                    hinfo = await getHouseState();
                }
                
                const paymentsByDateEct = payments.reduce((acc, pmt) => {
                    if (!acc[getPaymentKey(pmt)]) {
                        acc[getPaymentKey(pmt)] = [];
                    }
                    acc[getPaymentKey(pmt)].push(pmt);
                    return acc;
                }, {} as { [key: string]: IPaymentWithArg[] });
                pageDetails.rows.forEach(r => {
                    const pmt = page.fieldMap.reduce((acc, f) => {
                        acc[f] = r[f].val;
                        if (f === 'receivedAmount') {
                            const amtFlt = (acc[f] as any as string).replace(/[\$, ]/g, '');
                            const amt = parseFloat(amtFlt);
                            acc[f] = amt;
                            r[f].val = amtFlt;
                        } else if (f === 'receivedDate') {
                            const dateStr = moment(acc[f]).format('YYYY-MM-DD');
                            acc[f] = dateStr;
                            r[f].val = dateStr;
                        } else if (f === 'houseID') {
                            const house = pageState.getHouseByAddress(pageState, acc[f]);
                            if (house) {
                                acc['address'] = acc[f];
                                acc['houseID'] = house.houseID;
                                acc['ownerID'] = house.ownerID;
                            }
                        }
                        return acc;
                    }, {} as IPaymentWithArg);
                    r['PAYMENTOBJ'] = {
                        val: '',
                        obj: pmt,
                    };
                    const key = getPaymentKey(pmt);
                    const foundAry = paymentsByDateEct[key];
                    if (!foundAry) {
                        r['NOTFOUND'] = {
                            val: 'true',
                            obj: "not",
                        };
                        return;
                    }
                    for (let i = 0; i < foundAry.length; i++) {
                        if (foundAry[i].processed) continue;
                        r['FOUND'] = {
                            val: '',
                            obj: foundAry[i],
                        }
                        return;
                    }
                    r['NOTFOUND'] = {
                        val: 'true',
                        obj: "not",
                    };
                })
                dispatchCurPageState(state => {
                    return {
                        ...state,
                        //payments,
                        //paymentsByDateEct,
                        pageDetails,
                        ...hinfo,
                        //stateReloaded: state.stateReloaded+1,
                        reloadPayments: false,
                    }
                });
                            
            },
            displayHeader: (state, field, key) => {
                const fieldName = state.curPage.fieldMap[key];
                if (fieldName === 'receivedAmount') {
                    return <>Amount <button className='btn btn-primary' onClick={async () => {
                        for (let i = 0; i < state.pageDetails.rows.length; i++) {
                            const curRow = state.pageDetails.rows[i];
                            params.showProgress(`processing ${i}/${state.pageDetails.rows.length}`);
                            if (curRow['NOTFOUND']) {
                                try {
                                    params.pageState = state;
                                    await createPayment(params, i, i === state.pageDetails.rows.length - 1);
                                } catch (err) {
                                    const errStr = `Error create payment ${err.message}`;
                                    console.log(errStr);
                                    console.log(err);
                                    params.showProgress('');
                                    params.setErrorStr(errStr);
                                    break;
                                }
                            }
                        }
                        params.showProgress('done');
                    }}>Process All</button></>
                }
                return field;
            },
            displayItem: (state: IPageStates, field: string, item: IItemData, all, rowInd) => {
                if (!item) return 'NOITEM';
                if (field === 'receivedAmount') {
                    if (all['NOTFOUND']) {
                        //return `${item.val}=>Need import`
                        return <button disabled={!!all['DISABLED']} onClick={async () => {
                            //setProgressStr('processing')
                            params.showProgress('processing');
                            try {
                                params.pageState = state;
                                await createPayment(params, rowInd, true);
                                params.showProgress('');
                            } catch (err) {
                                const errStr = `Error create payment ${err.message}`;
                                console.log(errStr);
                                console.log(err);
                                params.showProgress('');
                                params.setErrorStr(errStr);
                            }
                            //setDlgContent(createPaymentFunc(state, all, rowInd))

                        }}> Click to create ${item.val}</button>
                    }
                    return '$'+item.val;
                }
                if (field === 'houseID') {
                    if (state.getHouseByAddress(state, item.val)) {
                        return `OK ${item.val}`;
                    }
                    //state.existingOwnersByName[]
                    //all[ownerName]
                    return <button onClick={() => {
                        //params.createHouse(state, all)
                        params.setDlgContent(createHouseFunc(params,state, all))
                    }}> Click to create {item.val}</button>
                } else
                    return item.val;
            }
        },
        {
            pageName: 'House Info',
            range: 'A1:I',
            fieldMap: [
                '', 'address', 'city', 'zip',
                '', //type
                '', //beds
                '', //rooms
                '', //sqrt
                'ownerName'
            ],
            idField: 'address',
            pageLoader: async (pageState: IPageStates) => {
                const page = pageState.curPage;
                const pageDetails: IDataDetails = pageState.pageDetails;
                let hi = {};
                if (!pageState.houses) {
                    //const hi = await getHouseInfo();
                    hi = await getHouseState();
                }
                dispatchCurPageState(state => {
                    return {
                        ...state,
                        pageDetails,
                        //houses: hi,
                        //housesByAddress: keyBy(hi, 'address'),
                        ...hi,
                    }
                });
            },
            displayItem: (state: IPageStates, field: string, item: IItemData, all) => {
                if (!item) return 'houseinfonull';            
                if (field === 'ownerName') {
                    if (!state.existingOwnersByName) return item.val;
                    if (!state.existingOwnersByName[item.val])
                    //if (missingOwnersByName[item.val])
                        return <button onClick={() => {
                            params.setDlgContent(createOwnerFunc(params,item.val))
                        }}> Click to create {item.val}</button>
                    else {
                        item.obj = state.existingOwnersByName[item.val];
                        const houseFromDb = state.getHouseByAddress(state, all["address"].val);
                        const matchedOwnerFromDb = houseFromDb && state.existingOwnersById[houseFromDb.ownerID];                        
                        //console.log(houseFromDb);
                        if (matchedOwnerFromDb) {                            
                            return item.val + " ok " + matchedOwnerFromDb.ownerID;
                        } else {
                            return item.val + " ok but no owner db";
                        }
                    }
                } else if (field === 'address') {
                    if (!item) return 'null';                    
                    if (state.getHouseByAddress(state, item.val)) {
                        return `OK ${item.val}`;
                    }
                    return <button onClick={() => {
                        //params.createHouse(state, all);
                        params.setDlgContent(createHouseFunc(params,state, all))
                    }}> Click to create {item.val}</button>
                } else
                    return item.val;
            }
        },
        {
            pageName: 'Lease Info',
            range: 'A1:M',
            fieldMap: [
                '',
                'houseID',
                'startDate',
                'endDate',
                'monthlyRent',
                'deposit',
                'petDeposit',
                'otherDeposit',
                'comment',
                'tenant1',
                'tenant2',
                'tenant3',
                'tenant4',
            ],
            idField:'houseID',
        }
    ];
    return pages;
}


const createOwnerFunc = (params:IPageDefPrms,ownerName: string, password='1') => {
    return <div className="col-lg-12 mb-4">
        <div className="card shadow mb-4 lg-6">
            <div className="card-header py-3">
                <h6 className="m-0 font-weight-bold text-primary">Projects</h6>
            </div>
            <div className="card-body">
                <h4 className="small font-weight-bold">Server Migration <span
                    className="float-right">20%</span></h4>
                <div className="progress mb-4">
                    <div className="progress-bar bg-danger" style={{ width: '20%' }}
                        aria-valuenow={20} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
                <h4 className="small font-weight-bold">Sales Tracking <span
                    className="float-right">40%</span></h4>
                <div className="progress mb-4">
                    <div className="progress-bar bg-warning" style={{ width: '40%' }}
                        aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
                <h4 className="small font-weight-bold">Customer Database <span
                    className="float-right">60%</span></h4>
                <div className="progress mb-4">
                    <div className="progress-bar" style={{ width: '60%' }}
                        aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
                <h4 className="small font-weight-bold">Payout Details <span
                    className="float-right">80%</span></h4>
                <div className="progress mb-4">
                    <div className="progress-bar bg-info" role="progressbar" style={{ width: '80%' }}
                        aria-valuenow={80} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
                <h4 className="small font-weight-bold">Account Setup <span
                    className="float-right">Complete!</span></h4>
                <div className="progress">
                    <div className="progress-bar bg-success" role="progressbar" style={{ width: '100%' }}
                        aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}></div>
                </div>
            </div>
        </div>

        <div className="row">
            <div className="col-lg-12 mb-4">
                <div className="card bg-light text-black shadow">
                    <div className="card-body" style={{ display: 'flex', justifyContent:'flex-end'}}>
                        <button className='btn btn-primary mx-1' onClick={() => {
                            sqlAdd('ownerInfo', 
                                {      
                                    ownerName,
                                    username: ownerName,
                                    password,
                                    shortName: ownerName,
                                }, true                                
                            ).then(res => {
                                console.log('sql add owner');
                                console.log(res)
                                return params.refreshOwners().then(() => {
                                    params.setDlgContent(null);  
                                })                                    
                            }).catch(err => {
                                console.log('sql add owner err');
                                console.log(err)
                            })
                        }}>Create</button>

                        <button className='btn btn-success' onClick={() => {
                            params.setDlgContent(null);
                        }}>Close</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
};

export const createPaymentFunc = (params:IPageDefPrms, state: IPageStates, data: { [key: string]: IItemData }, rowInd: number) => {        
    const saveData = data['PAYMENTOBJ'].obj;
    console.log('save data is')
    console.log(saveData)        
    return <div className="col-lg-12 mb-4">            
        <div className="row">
            <div className="col-lg-12 mb-4">
                <div className="card bg-light text-black shadow">
                    <div className="card-body" style={{ display: 'flex', justifyContent:'flex-end'}}>
                        <button className='btn btn-primary mx-1' onClick={() => {
                            sqlAdd('rentPaymentInfo', 
                            saveData, true                                
                            ).then(res => {
                                console.log('sql add owner');
                                console.log(res)
                                
                                return state.curPage.pageLoader && state.curPage.pageLoader(state).then(() => {
                                    params.setDlgContent(null);  
                                })                                    
                            }).catch(err => {
                                console.log('sql add owner err');
                                console.log(err)
                                params.setErrorStr(`sql add rentpayment error ${err.message}`);
                                
                            })
                        }}>Create</button>

                        <button className='btn btn-success' onClick={() => {
                            params.setDlgContent(null);
                        }}>Close</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
};

export const createHouseFunc = (params:IPageDefPrms, state: IPageStates, data: { [key: string]: IItemData }) => {
    const saveData = mapValues(data, itm => {
        return itm.val
    });
    const own = state.existingOwnersByName[saveData.ownerName];
    if (!own) {
        console.log('no owner found');
        return <InforDialog message='No Owner Found' hide={() => params.setDlgContent(null)}></InforDialog>;            
    }
    saveData.ownerID = own.ownerID.toString();
    return <div className="col-lg-12 mb-4">            
        <div className="row">
            <div className="col-lg-12 mb-4">
                <div className="card bg-light text-black shadow">
                    <div className="card-body" style={{ display: 'flex', justifyContent:'flex-end'}}>
                        <button className='btn btn-primary mx-1' onClick={() => {
                            sqlAdd('houseInfo', 
                            saveData, true                                
                            ).then(res => {
                                console.log('sql add owner');
                                console.log(res)
                                
                                return state.curPage.pageLoader && state.curPage.pageLoader(state).then(() => {
                                    params.setDlgContent(null);  
                                })                                    
                            }).catch(err => {
                                console.log('sql add owner err');
                                console.log(err)
                            })
                        }}>Create</button>

                        <button className='btn btn-success' onClick={() => {
                            params.setDlgContent(null);
                        }}>Close</button>
                    </div>
                </div>
            </div>
        </div>

    </div>
};