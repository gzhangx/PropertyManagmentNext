
import { IOwnerInfo, IHouseInfo, IPayment } from '../../reportTypes';
import { IPaymentWithArg, IPageInfo, IPageDataDetails, IPageStates, IPageParms, IDbSaveData } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import * as theApi from '../../api'
import { InforDialog, GetInfoDialogHelper } from '../../generic/basedialog';
import moment from 'moment'
import {keyBy, omit, mapValues} from 'lodash'
import React from 'react';

import { getBasicPageDefs } from './loads/basicPageInfo'
import { ALLFieldNames } from '../imports/types';

import * as lease from './loads/lease'
import * as tenantLoad from './loads/tenants'
import * as maintenceRecords from './loads/maintenanceRecords'
import * as houseLoader from './loads/house';
import * as paymentLoader from './loads/payment';

import * as inserter from './loads/inserter';


export function getPageDefs(selectedOwners: IOwnerInfo[]) {

    const paymentFieldMap: ALLFieldNames[] = [
                'receivedDate',
        'receivedAmount',
        'address',
        'paymentTypeID',
        'notes',
        'paymentProcessor',
        //'paidBy',        
                //'created',
                //'modified',                
                //'month',                
                //'ownerID',
            ];
    const basicDef = getBasicPageDefs();
    const pages: IPageInfo[] = [
        {
            pageName: 'PaymentRecord',
            range: 'A1:F',
            fieldMap: paymentFieldMap,
            displayColumnInfo: paymentFieldMap.map(field => ({
                field,
                name: field,
            })),
            dbLoader: () => getPaymentRecords().then(r => r as any as IDbSaveData[]),
            idField: 'receivedDate',
            rowComparers: paymentLoader.PaymentRowCompare,
            dbInserter: inserter.PaymentDbInserter,
            displayItem: paymentLoader.displayItem,
            shouldShowCreateButton: colInfo => colInfo.field === 'receivedAmount',
            reloadEntity: (params: IPageParms) => {
                params.dispatchCurPageState(state => {
                    return {
                        ...state,
                        reloadPayments: true,
                    }
                })
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
            dbLoader: h => getHouseInfo().then(r => r as any as IDbSaveData[]),
            rowComparers: houseLoader.HouseRowCompare,
            shouldShowCreateButton: colInfo => colInfo.field === 'address',
            displayColumnInfo: [
                {
                    field: 'address',
                    name:'Address'
                },
                {
                    field: 'city',
                    name: 'City'
                },
                {
                    field: 'zip',
                    name: 'Zip'
                },
                {
                    field: 'ownerName',
                    name: 'Owner'
                },
            ],
            idField: 'address',                       
        },
        {
            ...basicDef.lease,
        },
        {
            ...basicDef.tenant,
            rowComparers: tenantLoad.TenantRowCompare,
            dbLoader: () => theApi.getTenants(selectedOwners).then(r => r as any as IDbSaveData[]),
            extraProcessSheetData: tenantLoad.extraProcessSheetData,
            shouldShowCreateButton: colInfo => colInfo.field === 'fullName',
            dbInserter: inserter.getDbInserter('tenantInfo'),
        },
        {
            ...basicDef.maintenceRecords,
        }
    ];
    return pages;
}


const createOwnerFunc = (params:IPageParms,ownerName: string, password='1') => {
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


export const createHouseFunc = (params:IPageParms, state: IPageStates, data: { [key: string]: string }) => {
    const saveData = mapValues(data, itm => itm);
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
                                
                                //return state.curPage.pageLoader && state.curPage.pageLoader(params, state).then(() => {
                                //    params.setDlgContent(null);  
                                //})                                    
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