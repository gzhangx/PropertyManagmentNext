import React from 'react';
import { saveGoodSheetAuthInfo, } from '../../components/api';

import { usePageRelatedContext } from '../../components/states/PageRelatedState';


export default function GoogleSheetConfigPage() {        
    const mainCtx = usePageRelatedContext();
    const { googleSheetAuthInfo, setGoogleSheetAuthinfo, reloadGoogleSheetAuthInfo } = mainCtx;
    return <div className="container-fluid">        
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

    </div>
}

