import { IDbSaveData, IRowComparer, IStringDict, ISheetRowData, IPageDataDetails, ALLFieldNames, IPageParms, IDbRowMatchData } from '../types'
import { ILeaseInfo } from '../../../reportTypes';
import { Promise } from 'bluebird';

import { genericPageLoader  } from '../helpers';
import * as pageDefs from '../pageDefs'
import { IPageStates } from '../types';
import * as inserters from './inserter';

import * as lutil from './util';
import moment from 'moment';
import * as api from '../../../api'

import type { JSX } from "react";

function fixDates(date: string): string {
    const mnt = moment(date);
    if (mnt.isValid()) return mnt.format('YYYY-MM-DD');
    return date;
}
export const LeaseRowCompare: IRowComparer[] = [
    {
        name: 'Lease Row Comparer',
        getRowKey: (data: IDbSaveData) => {
            const le = data as any as ILeaseInfo;
            return `${le.ownerID}:${le.houseID}:${le.tenantID}:${fixDates(le.startDate)}:${fixDates(le.endDate)}`;
        },
        checkRowValid(data) {
            const le = data as any as ILeaseInfo;
            if (!le.houseID) return 'House not saved';
            if (!le.tenantID) return 'Tenant Not Saved'
            return null;
        },
    }
];

//change to ICmpItemByName later
interface ILeaseItemByName { [key: string]: ISheetRowData; }
interface ILeaseCustomData {
    tenantsByName: ILeaseItemByName;
    housesByName: ILeaseItemByName;
}

function fixLeaseData(dataInput: ISheetRowData, pageState: IPageStates)
{
    const data = dataInput.importSheetData;
    const leaseCustData = pageState.pageDetails.customData as ILeaseCustomData;    
    if (!data['tenantID']) {
        const tenantKey = lutil.getStdLowerName(data['tenant'].toString());
        const matched = leaseCustData.tenantsByName[tenantKey];
        if (!matched) return;
        if (matched.matched) {
            data['tenantID'] = matched.matched['tenantID'];
            //console.log('matched tenantID is ', data['tenantID'])
        }
    }
}
export async function leaseExtraProcessSheetData(datasInput: ISheetRowData[], pageState: IPageStates): Promise<ISheetRowData[]> {

    const leasePageInfo = pageDefs.getPageDefs().find(p => p.pageName === 'Tenants Info');
    const tenantsRowSheet = await genericPageLoader(null, {
        ...pageState,
        curPage: leasePageInfo,
    });
    const tenantsByName = tenantsRowSheet.dataRows.reduce((acc, dr) => {
        acc[lutil.getStdLowerName(dr.importSheetData['fullName'].toString())] = dr;
        return acc;
    }, {} as ILeaseItemByName);

    const housePageInfo = pageDefs.getPageDefs().find(p => p.pageName === 'House Info');
    const houseRowSheet = await genericPageLoader(null, {
        ...pageState,
        curPage: housePageInfo,
    });
    const housesByName = houseRowSheet.dataRows.reduce((acc, dr) => {
        acc[lutil.getStdLowerName(dr.importSheetData['address'].toString())] = dr;
        return acc;
    }, {} as ILeaseItemByName);

    pageState.pageDetails.customData = {
        tenantsByName,
        housesByName,
    } as ILeaseCustomData;
    //console.log('tenatnasByName', tenantsByName, tenantsRowSheet)

    const datas: ISheetRowData[] = datasInput.reduce((acc, data) => {
        //'tenant2', 'tenant3', 'tenant4'
        ['tenant1', ].forEach(tn => {
            const tenant = data.importSheetData[tn];
            if (tenant) {
                data.importSheetData['tenant'] = tenant;
                fixLeaseData(data, pageState);
                acc.push({
                    ...data,                    
                    importSheetData: {
                        ...data.importSheetData,
                    }
                })
            }
        });
        return acc;
    }, []);
    console.log(`lease page data`, datas)
    return datas;
}

export function displayItem(params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames): JSX.Element{
    if (field === 'startDate') return null;
    const displayStrValue = sheetRow.displayData[field];
    const leaseCustData = state.pageDetails.customData as ILeaseCustomData;    
    const tnameTag = lutil.getStdLowerName(displayStrValue?.toString());
    if (field === 'tenant') {        
        const tnt = (leaseCustData?.tenantsByName || {})[tnameTag];
        if (!tnt) {
            return <div>{displayStrValue} (!!No sheet value)</div>;        
        } else {
            if (!tnt.matched) {
                //return <div>{displayStrValue} (!!Not DB Value)</div>;        
                return <div><button className='btn btn-primary' onClick={() => {
                    console.log('on create tenant, sheetRow is', sheetRow, tnt);
                    const ins = inserters.getDbInserter('tenantInfo');
                    tnt.importSheetData['ownerID'] = sheetRow.importSheetData['ownerID'];
                    ins.createEntity(tnt.importSheetData).then(res => {
                        console.log(res);
                        const tenantID = res.id;
                        tnt.matched = {
                            tenantID,
                        }
                        params.dispatchCurPageState(state => ({
                            ...state,
                        }));
                    })
                }}>{displayStrValue} (Click To Create DB Val)</button></div>
            }
        }
    } else if (field === 'address') {
        const house = (leaseCustData?.housesByName || {})[tnameTag];
        if (!house) {
            return <div>{displayStrValue} (!!No sheet value)</div>;        
        } else {
            if (!house.matched) {
                //return <div>{displayStrValue} (!!Not DB Value)</div>;        
                return <div><button className='btn btn-primary' onClick={() => {

                }}>{displayStrValue} (Click To Create DB Val, Need implementation)</button></div>
            }
        }
    }
    return <div>{displayStrValue }</div>;
}

export function displayDbExtra(params: IPageParms, state: IPageStates, dbMatch: IDbRowMatchData, field: ALLFieldNames) {
    if (field === 'address') {
        return <button className='btn btn-primary' onClick={() => {
            const leaseID = dbMatch.dbItemData['leaseID'] as string;
            console.log('delete', leaseID)
            api.deleteLeases(leaseID).then(res => {
                console.log('delete got', res);
                const newdbMatchData = state.pageDetails.dbMatchData.filter(d => d.dbItemData['leaseID'] !== leaseID)
                params.dispatchCurPageState(state => ({
                    ...state,
                    pageDetails: {
                        ...state.pageDetails,
                        dbMatchData: newdbMatchData,
                    }
                }))
            })
        }}>Delete({dbMatch.dbItemData[field]})</button>
    }
    return dbMatch.dbItemData[field];
}
