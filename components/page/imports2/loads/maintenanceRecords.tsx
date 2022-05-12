export function test(){}
/*
import moment from 'moment'
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates, IPageDefPrms } from '../types'
import { IHouseInfo, ILeaseInfo, ITenantInfo } from '../../../reportTypes'
import { mapValues, trimStart } from 'lodash'
import { sqlAdd, getMaintenanceReport, sqlGet } from '../../../api'
import { getBasicPageDefs } from './basicPageInfo'
import { loadPageSheetDataRaw } from '../helpers'


export const TENANTINFO_ROW_STATE_NAME = 'TENANTINFO_ROW_STATE_NAME';

interface ITenantMatchInfo {
    dbTenant: ITenantInfo;
    sheetTenant: ITenantInfo;
    leaseHouseName: string;
}
export async function maintenanceRecords_PageLoader(pagePrms: IBasicImportParams, pageState: IPageStates): Promise<void> {
    if (!pageState.pageDetails) return;

    const lesePg = getBasicPageDefs().maintenceRecords;
    const leaseDataDetails = await loadPageSheetDataRaw(pageState.sheetId, lesePg);
    const leases = leaseDataDetails.rows.map(r => mapValues(r, r => r.val)) as any as ILeaseInfo[];
    const tenantToHouseNameFromLease = leases.reduce((acc, l) => {
        [1, 2, 3, 4].forEach(who => {
            const name = l[`tenant${who}`] as string;
            if (!name) return;
            const house = l.houseID;
            if (house) acc[name] = house;
        })

        return acc;
    }, {} as { [fname: string]: string });
    const tenantToHouse = leases.reduce((acc, l) => {
        [1, 2, 3, 4].forEach(who => {
            const name = l[`tenant${who}`] as string;
            if (!name) return;
            const house = pageState.housesByAddress[l.houseID.toLowerCase()];
            let found = acc[name];
            if (!found) {
                found = [];
                acc[name] = found;
            }
            if (house) found.push(house);
        })

        return acc;
    }, {} as { [fname: string]: IHouseInfo[] });

    pageState.pageDetails.rows.map(r => {
        const fullName = r['fullName'].val;
        const obj = {
            dbTenant: pageState.tenantByName[fullName],
            sheetTenant: mapValues(r, v => v.val) as any as ITenantInfo,
            leaseHouseName: tenantToHouseNameFromLease[fullName],
        } as ITenantMatchInfo;
        const matchHouses = tenantToHouse[obj.sheetTenant.fullName];
        if (matchHouses) {
            const fh = matchHouses[0];
            if (fh) {
                obj.sheetTenant.houseID = fh.houseID;
                obj.sheetTenant.ownerID = fh.ownerID;
            }
        }
        r[TENANTINFO_ROW_STATE_NAME] = {
            val: matchHouses && matchHouses.length > 1 ? `${matchHouses.length}` : '',
            obj,
        };
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


function createTenant(data: any) {
    return sqlGet({
        table: 'tenantInfo',
        whereArray: [
            {
                field: 'fullName',
                op: '=',
                val: data.fullName,
            },
            {
                field: 'ownerID',
                op: '=',
                val: data.ownerID,
            }
        ]
    }).then(res => {
        if (res.rows.length > 0) {
            return;
        }
        return sqlAdd('tenantInfo', data, true).then(r => {
            console.log('creation results');
            console.log(r);
            return r;
        })
    })
}
export function tenant_DisplayItem(params: IPageDefPrms, state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {
    if (!itm) return 'null itm';
    if (field === 'fullName') {
        const rs = all[TENANTINFO_ROW_STATE_NAME];
        const ti = rs.obj as ITenantMatchInfo;
        if (!ti.dbTenant) {
            if (!ti.sheetTenant.houseID) {
                return <div>{itm.val} (house not found {ti.leaseHouseName})</div>
            }
            if (rs.val) {
                return <div>{itm.val} (Too many houses {rs.val} )</div>
            }
            return <button onClick={() => {
                params.dispatchCurPageState(state => ({
                    ...state,
                }));
                createTenant(ti.sheetTenant).then(r => {
                    ti.dbTenant = {
                        tenantID: 'fake',
                    } as ITenantInfo;
                    if (!r) {
                        params.setErrorStr('Already exists');
                    }
                    params.refreshTenants();
                });
            }}>need create {itm.val}</button>
        }
    }
    return itm.val;
}
export function tenant_DisplayHeader(params: IPageDefPrms, state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}

*/