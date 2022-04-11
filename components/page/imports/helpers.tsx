
import { IPageInfo, IPageInfoBasic, IDataDetails,IItemData,IBasicImportParams } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { IPageStates } from './types'
import {INVALID_PAYMENT_ROW_TAG} from './loads/payment'
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

export async function loadPageSheetDataRaw(sheetId: string, curPage: IPageInfoBasic): Promise<IDataDetails> {
    if (!curPage) return;
    
    return googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r) => {
        if (!r || !r.values.length) {
            console.log(`no data for ${curPage.pageName}`);
            return null;
        }
        if (curPage.fieldMap) {
            const columns = curPage.fieldMap.reduce((acc, f, ind) => {
                if (f) {
                    acc.push(r.values[0][ind]);
                }
                return acc;
            }, [] as string[]);
            const rows = r.values.slice(1).map(rr => {
                return curPage.fieldMap.reduce((acc, f, ind) => {
                    if (f) {
                        acc[f] = {
                            val: rr[ind],
                            obj: null,
                        };
                    }
                    return acc;
                }, {} as { [key: string]: IItemData; });
            }).filter(x => x[curPage.idField].val);
            return ({
                columns,
                rows,
            })
        } else {
            const columns = r.values[0];
            const rows = r.values.slice(1).map(r => {
                return r.reduce((acc, celVal, ind) => {
                    acc[ind] = {
                        val: celVal,
                        obj: null,
                    }
                    return acc;
                }, {} as { [key: string]: IItemData; });
            })
            return ({
                columns,
                rows,
            });
        }
    }).catch(err => {
        console.log(err);
        return null;
    });
}


export async function createPayment(importState: IBasicImportParams, rowInd: number, reloadPayments: boolean) {    
    const state = importState.pageState;
    const dispatchCurPageState = importState.dispatchCurPageState;
    const changeRow = state.pageDetails.rows[rowInd];
    const saveData = changeRow[INVALID_PAYMENT_ROW_TAG].obj;
    changeRow['DISABLED'] = { val: 'true', obj: null };
    if (changeRow['PAYMENT_IMPORT_INVALID']) {
        console.log(`invalid payment, don't create ${changeRow['PAYMENT_IMPORT_INVALID'].val}`);
        return;
    }
    sqlAdd('rentPaymentInfo',
        saveData, true
    ).then(res => {
        console.log('sql add owner');
        console.log(res)
    }).catch(err => {
        console.log('sql add owner err');
        console.log(err)
        importState.setErrorStr(`sql add rentpayment error ${err.message}`);
    })
    dispatchCurPageState(state => {
        return {
            ...state,
            stateReloaded: ++state.stateReloaded,
            reloadPayments,
            pageDetails: {
                ...state.pageDetails,
            }
        }
    })
}
