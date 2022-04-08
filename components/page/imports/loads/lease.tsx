
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from '../types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../../api'
import { keyBy } from 'lodash'

interface ITenantInfo {
    'firstName': string;
    'lastName': string;
    'fullName': string;
    'phone': string;
    'email': string;
}

async function getTenants(pageState: IPageStates) {
    const tenantsRaw = await googleSheetRead(pageState.sheetId, 'read', `'Tenants Info'!A1:M`);
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
}

export async function lease_PageLoader(pageState: IPageStates) : Promise <void> {
    const tenants = await getTenants(pageState);
    const tenantsByFullName = keyBy(tenants, t => t.fullName.toLowerCase());
    pageState.pageDetails.rows.map(r => {        
        const rState = {
            tenantxFound: [],
        } as ILeaseInfoRowState;
        r[LEASEINFO_ROW_STATE_NAME] = {
            val: '',
            obj: rState,
        };
        [1, 2, 3, 4].forEach(ti => {
            const tn = tenantsByFullName[(r[`tenant${ti}`].val || '').toLowerCase()]
            rState.tenantxFound[ti] = tn;
        });
    });
}

export function lease_DisplayItem(state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {
    return '';
}
export function lease_DisplayHeader(state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}