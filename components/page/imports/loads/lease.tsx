
import moment from 'moment'
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates, IPageDefPrms } from '../types'
import { googleSheetRead, getOwners, sqlAdd, getLeases, } from '../../../api'
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
        return `${l.houseID}-${l.startDate}-${l.endDate}`;
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

export function lease_DisplayItem(params: IPageDefPrms, state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {    
    if (!itm) return 'null itm';
    return itm.val;
}
export function lease_DisplayHeader(params: IPageDefPrms, state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}