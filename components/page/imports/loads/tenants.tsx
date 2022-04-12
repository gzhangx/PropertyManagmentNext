
import moment from 'moment'
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates, IPageDefPrms } from '../types'
import { ITenantInfo } from '../../../reportTypes'
import { mapValues } from 'lodash'
import { sqlAdd, googleSheetRead } from '../../../api'
import { getBasicPageDefs } from './basicPageInfo'
import { loadPageSheetDataRaw } from '../helpers'


export const TENANTINFO_ROW_STATE_NAME = 'TENANTINFO_ROW_STATE_NAME';

export async function tenant_PageLoader(pagePrms: IBasicImportParams, pageState: IPageStates): Promise<void> {
    if (!pageState.pageDetails) return;

    const lesePg = getBasicPageDefs().lease;
    const leaseDataDetails = await loadPageSheetDataRaw(pageState.sheetId, lesePg);
    const leases = leaseDataDetails.rows.map(r=>mapValues(r, r => r.val));
    const tenantToHouse = leases.reduce((acc, l) => {
        [1, 2, 3, 4].forEach(who => {
            const name = l[`tenant${who}`];
            if (!name) return;
            let found =acc[name];
            if (!found) {
                found = [];
                acc[name] = found;
            }
            found.push(l);    
        })
        
        return acc;
    }, {} as { [fname: string]: { [key: string]: string; }[] });
    console.log('tenantToHouse is')
    console.log(tenantToHouse)
    const gsLease = await googleSheetRead(pageState.sheetId, 'read', `'Lease Info'!A1:M`);
    pageState.pageDetails.rows.map(r => {                
        r[TENANTINFO_ROW_STATE_NAME] = {
            val: '',
            obj: pageState.tenantByName[r['fullName'].val],
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
        if (!rs.obj) {
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