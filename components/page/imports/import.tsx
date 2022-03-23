import React, { useState } from 'react';
import { googleSheetRead } from '../../api'
import { EditTextDropdown} from '../../generic/EditTextDropdown'
export function ImportPage() {
    interface IPageInfo {
        pageName: string;
        range: string;
    }
    const pages:IPageInfo[] = [
        {
            pageName: 'Tenants Info',
            range: 'A1:G',
        },
        {
            pageName: 'Lease Info',
            range:'A1:M',
        },
        {
            pageName: 'House Info',
            range:'A1:I'
        }
    ];
    const [curOage, setCurrentPage] = useState<IPageInfo>();
    const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';
    return <div className="container-fluid">
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
                                            if (curOage) {
                                                googleSheetRead(sheetId, 'read', `'${curOage.pageName}'!${curOage.range}`).then(r => {
                                                    console.log(r);
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
        
        </div>
    </div>
}