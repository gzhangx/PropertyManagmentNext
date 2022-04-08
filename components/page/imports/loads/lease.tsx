
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from '../types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../../api'

interface ITenantInfo {
    'firstName': string;
    'lastName': string;
    'fullName': string;
    'phone': string;
    'email': string;
}
export async function lease_PageLoader(pageState: IPageStates) : Promise <void> {
    const tenants = await googleSheetRead(pageState.sheetId, 'read', `'Tenants Info'!A1:M`);
    const tenantFieldMap = ['', 'firstName', 'lastName', 'fullName', 'phone', 'email'];
    tenants.values;
}
export function lease_DisplayItem(state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {
    return '';
}
export function lease_DisplayHeader(state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}