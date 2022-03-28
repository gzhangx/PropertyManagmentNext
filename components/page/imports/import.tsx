import React, { useState, useEffect } from 'react';
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo, IHouseInfo } from '../../reportTypes';
import { keyBy, mapValues} from 'lodash'

import { BaseDialog} from '../../generic/basedialog'
type ALLFieldNames = ''|'address'|'city'|'zip'| 'ownerName';
export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    const [houseInfos, setHouseInfos] = useState<{
        houses: IHouseInfo[];
        houseByName: {
            [address: string]: IHouseInfo;
        }
    }>(null);
    interface IPageInfo {
        pageName: string;
        range: string;
        fieldMap?: ALLFieldNames[];
        idField?: ALLFieldNames;
        pageLoader?: () => Promise<void>;
        displayItem?: (field: string, itm: IItemData, all:{[key:string]:IItemData}) => JSX.Element|string;
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

    const [curPage, setCurrentPage] = useState<IPageInfo>();
    const [pageDetails, setPageDetails] = useState<IDataDetails>();
    const [existingOwnersByName, setExistingOwnersByName] = useState<{ [ownerName: string]: IOwnerInfo }>();
    const [existingOwnersById, setExistingOwnersById] = useState<{ [ownerId: number]: IOwnerInfo }>();
    const [missingOwnersByName, setMissingOwnersByName] = useState<{ [ownerName: string]: boolean }>({});
    const [existingHousesByAddress, setExsitingHouseByAddress] = useState<{ [address: string]: IHouseInfo }>({});

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
                if (!houseInfos) {
                    const hi = await getHouseInfo();
                    setHouseInfos({
                        houses: hi,
                        houseByName: hi.reduce((acc, h) => {
                            acc[h.address] = h;
                            return acc;
                        }, {} as { [addr: string]: IHouseInfo; }),
                    });
                }
                if (pageDetails) {
                    const missing = pageDetails.rows.reduce((acc, r) => {
                        const ownerIdField = r['ownerID'];
                        if (!existingOwnersByName[ownerIdField.val]) {
                            acc[ownerIdField.val] = true;
                        }
                        return acc;
                    }, {} as { [ownerName: string]: boolean; });
                    setMissingOwnersByName(missing);
                }
            },
            displayItem: (field: string, item: IItemData, all) => {
                if (field === 'ownerName') {
                    if (missingOwnersByName[item.val])
                        return <button onClick={() => {
                            setDlgContent(createOwnerFunc(item.val))
                        }}> Click to create {item.val}</button>
                    else {
                        item.obj = existingOwnersByName && existingOwnersByName[item.val];
                        const houseFromDb = existingHousesByAddress[all["address"].val];
                        const matchedOwnerFromDb = houseFromDb && existingOwnersById[houseFromDb.ownerID];                        
                        //console.log(houseFromDb);
                        if (matchedOwnerFromDb) {
                            console.log('existingHousesByAddress')
                            console.log(existingHousesByAddress)
                            return item.val + " ok " + matchedOwnerFromDb.ownerID;
                        } else {
                            return item.val + " ok but no owner db";
                        }
                    }
                } else if (field === 'address') {
                    if (existingHousesByAddress[item.val]) {
                        return `OK ${item.val}`;
                    }
                    return <button onClick={() => {
                        setDlgContent(createHouseFunc(all))
                    }}> Click to create {item.val}</button>
                } else
                    return item.val;
            }
        }
    ];
    

    const refresOwners = () => {
        return getOwners().then(own => {
            setExistingOwnersByName(keyBy(own, 'ownerName'));
            setExistingOwnersById(keyBy(own, 'ownerID'));
        });
    }
    const refresHouses = () => {
        return getHouseInfo().then(own => {
            setExsitingHouseByAddress(keyBy(own, 'address'));
        });
    }
    useEffect(() => {
        refresOwners();
        refresHouses();
    }, []);

    useEffect(() => {
        if (!curPage || !curPage.fieldMap || !curPage.pageLoader) return;
        curPage.pageLoader();
    }, [curPage, existingOwnersByName, pageDetails])
        
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

    const createHouseFunc = (data: { [key: string]: IItemData }) => {
        const saveData = mapValues(data, itm => {
            return itm.val
        });
        const own = existingOwnersByName[saveData.ownerName];
        if (!own) {
            console.log('no owner found');
            return;
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
                                    return refresHouses().then(() => {
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
                            setCurrentPage(sel.value);
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
                            pageDetails && pageDetails.columns && pageDetails.columns.map((d, key) => {
                                return <td key={key}>{d}</td>
                            })
                        }
                    </tr>
                </thead>
                <tbody>
                    {
                        pageDetails && pageDetails.rows.map((p, ind) => {
                            let keys = curPage.fieldMap as string[];
                            if (!keys) {
                                keys = pageDetails.columns.map((d, ind) => ind.toString());
                            } else {
                                keys = keys.filter(x => x);
                            }
                            return <tr key={ind}>{
                                keys.map((key, ck) => {
                                    return <td key={ck}>{
                                        curPage.displayItem ? curPage.displayItem(key, p[key],p) : (p[key])
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