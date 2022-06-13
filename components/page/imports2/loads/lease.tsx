import { IDbSaveData, IRowComparer, IStringDict, ISheetRowData, IPageDataDetails, ALLFieldNames, IPageParms } from '../types'
import { ILeaseInfo } from '../../../reportTypes';
import { Promise } from 'bluebird';

import { genericPageLoader  } from '../helpers';
import * as pageDefs from '../pageDefs'
import { IPageStates } from '../types';

import * as lutil from './util';

export const LeaseRowCompare: IRowComparer[] = [
    {
        name: 'Lease Row Comparer',
        getRowKey: (data: IDbSaveData) => {
            const le = data as any as ILeaseInfo;
            return `${le.ownerID}-${le.houseID}-${le.tenantID}-${le.startDate}-${le.endDate}`;
        },
    }
];


interface ILeaseItemByName { [key: string]: ISheetRowData; }
interface ILeaseCustomData {
    tenantsByName: ILeaseItemByName;
    housesByName: ILeaseItemByName;
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
    console.log('tenatnasByName', tenantsByName, tenantsRowSheet)

    const datas: ISheetRowData[] = datasInput.reduce((acc, data) => {
        ['tenant1', 'tenant2', 'tenant3', 'tenant4'].forEach(tn => {
            const tenant = data.importSheetData[tn];
            if (tenant) {
                data.importSheetData['tenant'] = tenant;
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
    console.log(`lease page data`, datas, datasInput)
    datas.forEach(data => {
    })
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
                    console.log('on create tenant, sheetRow is', sheetRow);
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
/*
import moment from 'moment'
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates, IPageDefPrms } from '../types'
import { googleSheetRead, getOwners, sqlAdd, getLeases, sqlGet } from '../../../api'
import { ITenantInfo, ILeaseInfo } from '../../../reportTypes'
import { keyBy } from 'lodash'



async function getTenants(pageState: IPageStates) {
    const tenantsRaw = await googleSheetRead(pageState.sheetId, 'read', `'Tenants Info'!A1:F`);
    const tenantFieldMap = ['', 'firstName', 'lastName', 'fullName', 'phone', 'email'];
    const tenants = tenantsRaw.values.map(r => {
        return tenantFieldMap.reduce((acc, f, ind) => {
            if (f) {
                acc[f] = r[ind];
            }
            return acc;
        }, {} as ITenantInfo);
    });
    return tenants;
}

export const LEASEINFO_ROW_STATE_NAME = 'LEASEINFO_ROW_STATE_NAME';
interface ILeaseInfoRowState {
    tenantFound: boolean;
    tenantxFound: ITenantInfo[];
    dbLease: ILeaseInfo;
    sheetLease: ILeaseInfo;
    address: string;
}

export async function lease_PageLoader(pagePrms: IBasicImportParams, pageState: IPageStates) : Promise <void> {
    const tenants = (await getTenants(pageState)).filter(t=>t.fullName).slice(1);
    const tenantsByFullName = keyBy(tenants, t => t.fullName.toLowerCase());
    const dbLeases = (await getLeases(pageState.selectedOwners)).map(l => {
        return {
            ...l,
            startDate: moment(l.startDate).format('YYYY-MM-DD'),
            endDate: moment(l.endDate).format('YYYY-MM-DD'),
        }
    });
    function getLeaseKey(l: ILeaseInfo) {
        return `${l.houseID}-${l.tenantID}-${l.startDate}-${l.endDate}`;
    }
    const dbLeasesByKey = keyBy(dbLeases, getLeaseKey);
    pageState.pageDetails.rows.map(r => {        
        const rState = {
            tenantxFound: [],
        } as ILeaseInfoRowState;
        r[LEASEINFO_ROW_STATE_NAME] = {
            val: '',
            obj: rState,
        };
        rState.address = r['houseID'].val;
        const startDate = moment(r['startDate'].val).format('YYYY-MM-DD');
        r['startDate'].val = startDate;
        const endDate = moment(r['endDate'].val).format('YYYY-MM-DD');
        r['endDate'].val = endDate;
        const house = pageState.getHouseByAddress(pageState, rState.address);
        let tenantID = '';
        const tenant = pageState.tenantByName[r['tenant1'].val];
        if (tenant) {
            tenantID = tenant.tenantID;
        }
        const getAmt = amtStr => {
            const clearedStr = amtStr.replace(/[$,]/g, '').trim();
            if (!clearedStr) return 0;
            return parseFloat(clearedStr)
        }
        rState.sheetLease = {
            leaseID: '',
            startDate,
            endDate,
            deposit: getAmt(r['deposit'].val),
            petDeposit: getAmt(r['petDeposit'].val),
            otherDeposit: getAmt(r['otherDeposit'].val),
            ownerID: house?house.ownerID:0,
            houseID: house ? house.houseID : '',
            tenantID,
            comment: r['comment'].val,
            monthlyRent: getAmt(r['monthlyRent'].val),
        };
        const newKey = getLeaseKey(rState.sheetLease);
        const db = dbLeasesByKey[newKey];
        if (db) {
            rState.sheetLease.leaseID = db.leaseID;
        }
        [1, 2, 3, 4].forEach(ti => {
            const tn = tenantsByFullName[(r[`tenant${ti}`].val || '').trim().toLowerCase()]
            rState.tenantxFound[ti] = tn;
        });
    });
    pagePrms.dispatchCurPageState(state => {
        return {
            ...state,
            pageDetails: {
                ...pageState.pageDetails
            },
        }
    })
}


function createLease(lease: ILeaseInfo) {
    return sqlGet({
        table: 'leaseInfo',
        whereArray: [
            {
                field: 'houseID',
                op: '=',
                val: lease.houseID,
            },
            {
                field: 'ownerID',
                op: '=',
                val: lease.ownerID,
            },            
            {
                field: 'tenantID',
                op: '=',
                val: lease.tenantID,
            },            
            {
                field: 'startDate',
                op: '=',
                val: lease.startDate,
            },            
            {
                field: 'endDate',
                op: '=',
                val: lease.endDate,
            }
        ]
    }).then(res => {
        if (res.rows.length > 0) {
            console.log('has lease res', res.rows[0])
            return res.rows[0];
        }
        console.log('creating');        
        return sqlAdd('leaseInfo', lease as any, true).then(l => {
            console.log(`created lease`, l);
            return l;
        });
    });
}
export function lease_DisplayItem(params: IPageDefPrms, state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {    
    if (!itm) return 'null itm';
    if (!all[LEASEINFO_ROW_STATE_NAME]) return 'noull'
    const stored = all[LEASEINFO_ROW_STATE_NAME].obj as ILeaseInfoRowState;    
    if (field === 'houseID') {
        //console.log(`field=${field} val=${itm.val} `,stored.sheetLease)
        const lobj = stored.sheetLease;
        if (lobj.leaseID) {
            return `${itm.val} good`
        } else {
            return <button onClick={() => {
                console.log(lobj);
                lobj.leaseID = 'fake';
                params.dispatchCurPageState(state => {
                    return { ...state };
                })
                createLease(lobj).then(r => {
                    lobj.leaseID = r.id;
                    params.dispatchCurPageState(state => {
                        return { ...state };
                    })
                });
            }}>create {itm.val}</button>
        }
    }
    return itm.val;
}
export function lease_DisplayHeader(params: IPageDefPrms, state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}
*/