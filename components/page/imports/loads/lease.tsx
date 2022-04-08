
import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from '../types'


export async function lease_PageLoader(pageState: IPageStates) : Promise <void> {
    
}
export function lease_DisplayItem(state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number): JSX.Element | string {
    return '';
}
export function lease_DisplayHeader(state: IPageStates, field: string, key: number): JSX.Element | string {
    return '';
}