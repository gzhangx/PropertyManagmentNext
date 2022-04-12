
import moment from 'moment'
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates, IPageDefPrms } from '../types'
import { IHouseInfo, ITenantInfo } from '../../../reportTypes'
import { mapValues, trimStart } from 'lodash'
import { sqlAdd, googleSheetRead } from '../../../api'
import { getBasicPageDefs } from './basicPageInfo'
import { loadPageSheetDataRaw } from '../helpers'


export const TENANTINFO_ROW_STATE_NAME = 'TENANTINFO_ROW_STATE_NAME';

interface ITenantMatchInfo {
    dbTenant: ITenantInfo;
    sheetTenant: ITenantInfo;
}
export async function tenant_PageLoader(pagePrms: IBasicImportParams, pageState: IPageStates): Promise<void> {
    if (!pageState.pageDetails) return;

    const lesePg = getBasicPageDefs().lease;
    const leaseDataDetails = await loadPageSheetDataRaw(pageState.sheetId, lesePg);
    const leases = leaseDataDetails.rows.map(r=>mapValues(r, r => r.val));
    const tenantToHouse = leases.reduce((acc, l) => {
        [1, 2, 3, 4].forEach(who => {
            const name = l[`tenant${who}`];
            if (!name) return;
            const house = pageState.housesByAddress[name.toLowerCase()];
            let found =acc[name];
            if (!found) {
                found = [];
                acc[name] = found;
            }
            if (house) found.push(house);    
        })
        
        return acc;
    }, {} as { [fname: string]: IHouseInfo[] });
    console.log('tenantToHouse is')
    console.log(tenantToHouse)
        
    pageState.pageDetails.rows.map(r => {                
        const obj = {
            dbTenant: pageState.tenantByName[r['fullName'].val], 
            sheetTenant: mapValues(r, v=>v.val) as any as ITenantInfo,
        } as ITenantMatchInfo;
        const matchHouses = tenantToHouse[obj.sheetTenant.fullName];
        if (matchHouses) {
            obj.sheetTenant.houseID = matchHouses[0].houseID;
            obj.sheetTenant.ownerID = matchHouses[0].ownerID;
        }
        r[TENANTINFO_ROW_STATE_NAME] = {
            val: matchHouses && matchHouses.length > 1 ?`${matchHouses.length}`:'',
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
    return sqlAdd('tenantInfo', data, true).then(r=> {
        console.log('creation results');
        console.log(r);
    })
}
export function  tenant_DisplayItem(params: IPageDefPrms, state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {    
    if (!itm) return 'null itm';
    if (field === 'fullName') {
        const rs = all[TENANTINFO_ROW_STATE_NAME];
        const ti = rs.obj as ITenantMatchInfo;
        if (!ti.dbTenant) {
            if (!ti.sheetTenant.houseID) {
                return <div>{ itm.val} (house not found)</div>
            }
            if (rs.val) {
                return <div>{itm.val} (Too many houses {rs.val} )</div>
            }
            return <button onClick={() => {                
                createTenant(mapValues(all,a=>a.val));
            }}>need create {itm.val}</button>
        }
    }
    return itm.val;
}
export function  tenant_DisplayHeader(params: IPageDefPrms, state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}