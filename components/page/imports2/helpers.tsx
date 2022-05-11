
import { IPageInfo, IBasicImportParams, IStringDict, ICompRowData, IPageStates, IPageParms, IPageDataDetails, IDbSaveData } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { PAYMENT_ROW_PAYMENTOBJ_TAG } from './loads/payment'
import { keyBy } from 'lodash'
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

export async function loadPageSheetDataRaw(sheetId: string, curPage: IPageInfo): Promise<IPageDataDetails> {
    if (!curPage) return;
    
    return googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r) => {
        if (!r || !r.values || !r.values.length) {
            console.log(`no data for ${curPage.pageName}`);
            return null;
        }
        
        const colNames: IStringDict = curPage.fieldMap.reduce((acc, f, ind) => {
            if (f) {
                acc[f] = r.values[0][ind];
            }
            return acc;
        }, {});
        const dataRows: ICompRowData[] = r.values.slice(1).map(rr => {
            const importSheetData = curPage.fieldMap.reduce((acc, f, ind) => {
                if (f) {
                    acc[f] = rr[ind];
                }
                return acc;
            }, {} as IStringDict);
            return {
                matchRes: 'NA',
                importSheetData,
            } as ICompRowData;
        }).filter(x => x[curPage.idField]);
        return {
            colNames,
            dataRows,
        } as IPageDataDetails;   
    }).catch(err => {
        console.log(err);
        throw err;
    });
}


export async function createPayment(importState: IBasicImportParams, rowInd: number, reloadPayments: boolean) {    
    const state = importState.pageState;
    const dispatchCurPageState = importState.dispatchCurPageState;
    const changeRow = state.pageDetails.dataRows[rowInd];
    const saveData = changeRow.saveData;
    changeRow.disabled = true;
    if (changeRow.invalid) {
        console.log(`invalid payment, don't create ${changeRow.invalid}`);
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


export async function getHouseState() {
    const hi = await getHouseInfo();
    return {
        houses: hi,
        housesByAddress: keyBy(hi, h => h.address.toLowerCase()),
    }
}

async function pageLoader(prms: IPageParms, sheetId: string, pageState: IPageStates) {
    const page = pageState.curPage;
    const pageDetails = await loadPageSheetDataRaw(sheetId, page);
    let hi = {};
    if (!pageState.houses) {
        //const hi = await getHouseInfo();
        hi = await getHouseState();
    }
    let dbData: IDbSaveData[] = [];
    if (page.dbLoader) {
        dbData = await page.dbLoader(pageState.selectedOwners);
    }
    
    prms.dispatchCurPageState(state => {
        return {
            ...state,
            pageDetails,
            //houses: hi,
            //housesByAddress: keyBy(hi, 'address'),
            ...hi,
        }
    });
}