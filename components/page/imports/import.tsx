import React, { useState, useEffect } from 'react';
import { googleSheetRead, getOwners } from '../../api'
import { EditTextDropdown } from '../../generic/EditTextDropdown'
import { IOwnerInfo } from '../../reportTypes';
import { keyBy, omit} from 'lodash'

import { CloseableDialog} from '../../generic/basedialog'
type ALLFieldNames = ''|'address'|'city'|'zip'| 'OwnerIDCreateByOwnerName';
export function ImportPage() {
    const [dlgContent, setDlgContent] = useState<JSX.Element>(null);
    interface IPageInfo {
        pageName: string;
        range: string;
        fieldMap?: ALLFieldNames[];
        idField?: ALLFieldNames;
    }

    interface IDataDetailsData {
        action: 'label' | 'OwnerIDCreateByOwnerName';
        value: string;
    };
    interface IDataDetails {
        columns: string[];
        rows: {
            [key: string]:IDataDetailsData; //key is of ALLFieldNames
        }[];
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
            pageName: 'House Info',
            range: 'A1:I',
            fieldMap: [
                '', 'address', 'city', 'zip',
                '', //type
                '', //beds
                '', //rooms
                '', //sqrt
                'OwnerIDCreateByOwnerName'
            ],
            idField:'address',
        }
    ];
    const [curPage, setCurrentPage] = useState<IPageInfo>();
    const [pageDetails, setPageDetails] = useState<IDataDetails>();
    const [existingOwnersByName, setExistingOwnersByName] = useState<{ [ownerName: string]: IOwnerInfo }>();
    const [missingOwnersByName, setMissingOwnersByName] = useState<{ [ownerName: string]: boolean }>({});

    useEffect(() => {
        getOwners().then(own => {
            setExistingOwnersByName(keyBy(own, 'ownerName'));
        });
    }, []);

    useEffect(() => {
        if (!curPage || !curPage.fieldMap) return;
        const ownerField = curPage.fieldMap.find(f => f === 'OwnerIDCreateByOwnerName');
        if (ownerField && pageDetails) {
            const missing = pageDetails.rows.reduce((acc, r) => {
                if (!existingOwnersByName[r['OwnerIDCreateByOwnerName'].value]) {
                    acc[r['OwnerIDCreateByOwnerName'].value] = true;
                }
                return acc;
            }, {} as { [ownerName: string]: boolean; });
            setMissingOwnersByName(missing);
        }
    },[curPage, existingOwnersByName, pageDetails])
    const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';
    return <div className="container-fluid">
        <CloseableDialog children={dlgContent} show={dlgContent != null} setShow={() => {
            setDlgContent(null);
        } }/>
        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            
            <h1 className="h3 mb-0 text-gray-800">Develop</h1>
            <div className='row'>
                <EditTextDropdown items={pages.map(p => {
                    return {
                        label: p.pageName,
                        value: p,
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
                                            console.log('shee tread')
                                            //googleSheetRead('1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg', 'read', `'Tenants Info'!A1:B12`).then(r => {
                                            if (curPage) {
                                                googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r: {
                                                    values: string[][];
                                                }) => {
                                                    console.log('googlesheet results');
                                                    console.log(r);
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
                                                                    const data: IDataDetailsData = {
                                                                        action: 'label',
                                                                        value: rr[ind],
                                                                    }
                                                                    if (f === 'OwnerIDCreateByOwnerName') {
                                                                        data.action = 'OwnerIDCreateByOwnerName';
                                                                    }
                                                                    acc[f] = data;                                                                    
                                                                    //console.log(`setting accf ${f} to ${acc[f]}`)
                                                                }
                                                                return acc;
                                                            }, {} as { [key: string]: IDataDetailsData; });
                                                        }).filter(x=>x[curPage.idField].value);
                                                        setPageDetails({
                                                            columns,
                                                            rows,
                                                        })
                                                    } else {
                                                        const columns = r.values[0];
                                                        const rows = r.values.slice(1).map(r => {
                                                            return r.reduce((acc, celVal, ind) => {
                                                                acc[ind.toString()] = {
                                                                    action: 'label',
                                                                    value: celVal,
                                                                };
                                                                return acc;
                                                            }, {} as { [key: string]: IDataDetailsData; });
                                                        })
                                                        setPageDetails({
                                                            columns,
                                                            rows,
                                                        });
                                                    }
                                                }).catch(err => {
                                                    console.log(err);
                                                })
                                                console.log('done')
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
                                keys = pageDetails.columns.map((d, ind)=>ind.toString());
                            } else {
                                keys = keys.filter(x => x);
                            }
                            const dspAction = (dta: IDataDetailsData) => {
                                if (dta.action === 'label') return dta.value;
                                if (dta.action === 'OwnerIDCreateByOwnerName') {
                                    if ( missingOwnersByName[dta.value])
                                        return <button onClick={() => {
                                            setDlgContent(<div>
                                                {dta.value}
                                            </div>)
                                        }}>{ dta.value}</button>
                                    else {
                                        return dta.value+" ok";
                                    }
                                }
                                return dta.value;
                            }
                            return <tr key={ind}>{
                                keys.map((key, ck) => {
                                    return <td key={ck}>{
                                        dspAction(p[key])
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