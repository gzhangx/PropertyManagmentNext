import React, { useState, useEffect, useReducer } from 'react';
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo, IHouseInfo, IPayment } from '../../reportTypes';
import { keyBy, mapValues } from 'lodash'
import { InforDialog } from '../../generic/basedialog';

import { BaseDialog} from '../../generic/basedialog'
type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'houseID' | 'paymentTypeID' | 'paymentProcessor' | 'notes';

interface IPaymentWithArg extends IPayment
{
    processed: boolean;
}

export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    
    interface IPageInfo {
        pageName: 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info';
        range: string;
        fieldMap?: ALLFieldNames[];
        idField?: ALLFieldNames;
        pageLoader?: () => Promise<void>;
        displayItem?: (state: IPageStates,field: string, itm: IItemData, all:{[key:string]:IItemData}) => JSX.Element|string;
    }

    interface IItemData {
        val: string;
        obj: any;
    }
    interface IDataDetails {
        columns: string[];
        rows: {
            [key: string]:IItemData; //key is of ALLFieldNames
        }[];
    }

    interface IPageStates {
        curPage: IPageInfo;
        pageDetails: IDataDetails;

        existingOwnersByName: { [ownerName: string]: IOwnerInfo };
        existingOwnersById: { [ownerId: number]: IOwnerInfo };
        missingOwnersByName: { [ownerName: string]: boolean };
        housesByAddress: { [ownerName: string]: IHouseInfo };
        houses: IHouseInfo[];
        payments: IPaymentWithArg[];
        stateReloaded: number;
        getHouseByAddress: (state:IPageStates, addr: string) => IHouseInfo;
    }    

    const [curPageState, dispatchCurPageState] = useReducer((state: IPageStates, act: (state: IPageStates) => IPageStates) => act(state) as IPageStates, {
        stateReloaded: 0,
        housesByAddress: {},
        getHouseByAddress: (state,addr) => {            
            return state.housesByAddress[addr.toLowerCase()]
        },
    } as IPageStates);

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
            pageLoader: async () => {
                if (!curPageState.payments) {
                    const hi = await getPaymentRecords();
                    let hinfo = {};
                    if (!curPageState.houses) {
                        hinfo = await getHouseState();
                    }
                    dispatchCurPageState(state => {
                        return {
                            ...state,
                            payments: hi.map(h => ({ ...h, processed: false })),
                            ...hinfo,
                            //stateReloaded: state.stateReloaded+1,
                        }
                    });                    
                }                
            },
            displayItem: (state:IPageStates, field: string, item: IItemData, all) => {
                if (field === 'houseID') {
                    if (state.getHouseByAddress(state, item.val)) {
                        return `OK ${item.val}`;
                    }
                    //state.existingOwnersByName[]
                    //all[ownerName]
                    return <button onClick={() => {
                        setDlgContent(createHouseFunc(state, all))
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
            pageLoader: async () => {
                if (!curPageState.houses) {
                    //const hi = await getHouseInfo();
                    const hi = await getHouseState();
                    dispatchCurPageState(state => {
                        return {
                            ...state,
                            //houses: hi,
                            //housesByAddress: keyBy(hi, 'address'),
                            ...hi,
                        }
                    });                    
                }
            },
            displayItem: (state: IPageStates, field: string, item: IItemData, all) => {
                if (!item) return 'houseinfonull';            
                if (field === 'ownerName') {
                    if (!state.existingOwnersByName) return item.val;
                    if (!state.existingOwnersByName[item.val])
                    //if (missingOwnersByName[item.val])
                        return <button onClick={() => {
                            setDlgContent(createOwnerFunc(item.val))
                        }}> Click to create {item.val}</button>
                    else {
                        item.obj = state.existingOwnersByName[item.val];
                        const houseFromDb = state.getHouseByAddress(state. all["address"].val);
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
                        setDlgContent(createHouseFunc(state, all))
                    }}> Click to create {item.val}</button>
                } else
                    return item.val;
            }
        }
    ];
    

    const refresOwners = () => {
        return getOwners().then(own => {
            dispatchCurPageState(state => {
                return {
                    ...state,
                    existingOwnersById: keyBy(own, 'ownerID'),
                    existingOwnersByName: keyBy(own,'ownerName'),
                };                
            });
        });
    }

    useEffect(() => {
        refresOwners();
    }, []);

    useEffect(() => {
        if (!curPageState.curPage || !curPageState.curPage.fieldMap || !curPageState.curPage.pageLoader) return;
        curPageState.curPage.pageLoader();
    }, [curPageState.stateReloaded, curPageState.curPage, curPageState.existingOwnersByName, curPageState.pageDetails])
        
    console.log(`curPageState.stateReloaded=${curPageState.stateReloaded}`);
    const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';


    const createOwnerFunc = (ownerName: string, password='1') => {
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
                                    return refresOwners().then(() => {
                                        setDlgContent(null);  
                                    })                                    
                                }).catch(err => {
                                    console.log('sql add owner err');
                                    console.log(err)
                                })
                            }}>Create</button>

                            <button className='btn btn-success' onClick={() => {
                                setDlgContent(null);
                            }}>Close</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    };

    const createHouseFunc = (state: IPageStates, data: { [key: string]: IItemData }) => {
        const saveData = mapValues(data, itm => {
            return itm.val
        });
        const own = state.existingOwnersByName[saveData.ownerName];
        if (!own) {
            console.log('no owner found');
            return <InforDialog message='No Owner Found' hide={() => setDlgContent(null)}></InforDialog>;            
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
                                    
                                    return state.curPage.pageLoader && state.curPage.pageLoader().then(() => {
                                        setDlgContent(null);  
                                    })                                    
                                }).catch(err => {
                                    console.log('sql add owner err');
                                    console.log(err)
                                })
                            }}>Create</button>

                            <button className='btn btn-success' onClick={() => {
                                setDlgContent(null);
                            }}>Close</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    };
    
    return <div className="container-fluid">
        <BaseDialog children={dlgContent} show={dlgContent != null} />
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            
            <h1 className="h3 mb-0 text-gray-800">Develop</h1>
            <div className='row'>
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
            <a href='' onClick={e => {
                e.preventDefault();
                console.log('test clicked')
            }} >testtest </a>
            <div className="col-xl-3 col-md-6 mb-4">
                <div className="card shadow h-100 py-2 border-left-primary">
                    <div className="card-body">
                        <div className="row no-gutters align-items-center">
                            <div className="col mr-2">
                                <div className="text-xs font-weight-bold text-uppercase mb-1 text-primary">Test Google</div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                    <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"
                                        onClick={e => {
                                            e.preventDefault();
                                            const curPage = curPageState.curPage;
                                            const setPageDetails = (newd: IDataDetails) => {
                                                dispatchCurPageState(state => {
                                                    return {
                                                        ...state,
                                                        pageDetails: newd,
                                                    }
                                                })
                                            }
                                            //googleSheetRead('1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg', 'read', `'Tenants Info'!A1:B12`).then(r => {
                                            if (curPage) {
                                                googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r: {
                                                    values: string[][];
                                                }) => {                                                    
                                                    if (!r || !r.values.length) {
                                                        console.log(`no data for ${curPage.pageName}`);
                                                        return;
                                                    }
                                                    if (curPage.fieldMap) {
                                                        const columns = curPage.fieldMap.reduce((acc, f, ind) => {
                                                            if (f) {
                                                                acc.push(r.values[0][ind]);
                                                            }
                                                            return acc;
                                                        }, [] as string[]);
                                                        const rows = r.values.slice(1).map(rr => {
                                                            return curPage.fieldMap.reduce((acc, f, ind) => {
                                                                if (f) {
                                                                    acc[f] = {
                                                                        val: rr[ind],
                                                                        obj: null,
                                                                    };
                                                                }
                                                                return acc;
                                                            }, {} as { [key: string]: IItemData; });
                                                        }).filter(x=>x[curPage.idField].val);
                                                        setPageDetails({
                                                            columns,
                                                            rows,
                                                        })
                                                    } else {
                                                        const columns = r.values[0];
                                                        const rows = r.values.slice(1).map(r => {
                                                            return r.reduce((acc, celVal, ind) => {
                                                                acc[ind] = {
                                                                    val: celVal,
                                                                    obj: null,
                                                                }                                                      
                                                                return acc;
                                                            }, {} as { [key: string]: IItemData; });
                                                        })
                                                        setPageDetails({
                                                            columns,
                                                            rows,
                                                        });
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                })
                                            }
                                            e.stopPropagation();
                                        }}
                                    ><i
                                        className="fas fa-download fa-sm text-white-50" ></i> Read Sheet
                                    </a>
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
                                        curPageState.curPage.displayItem ? curPageState.curPage.displayItem(curPageState, key, p[key],p) : (p[key] && p[key].val)
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