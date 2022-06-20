
import { IHouseInfo, IPayment } from '../../../reportTypes';
import { IDbInserter, IDbSaveData, IRowComparer, YYYYMMDDFormater, IPageStates, ISheetRowData, ALLFieldNames, IPageParms } from '../types'

import * as api from '../../../api';

export const PaymentRowCompare: IRowComparer[] = [
    {
        name: 'Payment Row Comparer',
        getRowKey: (data: IDbSaveData) => {
            const pmt = data as any as IPayment;            
            const date = YYYYMMDDFormater(pmt.receivedDate);
            const amt = pmt.receivedAmount.toFixed(2);
            return `${date}-${amt}-${pmt.houseID}-${(pmt.paymentTypeID || '').trim()}-${(pmt.notes || '').trim()}`;
        },
    },
    {
        name: 'Payment Row Comparer No Notes',
        getRowKey: (data: IDbSaveData) => {
            const pmt = data as any as IPayment;
            const date = YYYYMMDDFormater(pmt.receivedDate);
            const amt = pmt.receivedAmount.toFixed(2);
            return `${date}-${amt}-${pmt.houseID}-${(pmt.paymentTypeID || '').trim()}`;
        },
    }
];


export function displayItem(params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames): JSX.Element {
    if (field === 'receivedAmount') {
        const itemVal = sheetRow.displayData[field];
        return <button disabled={!sheetRow.needUpdate || !!sheetRow.invalid} onClick={async () => {
            //setProgressStr('processing')
            if (sheetRow.invalid || !sheetRow.needUpdate) return;
            params.showProgress('processing');
            try {
                await state.curPage.dbInserter.createEntity(sheetRow.importSheetData);
                sheetRow.needUpdate = false;
                params.dispatchCurPageState(state => ({
                    ...state,                
                }));
                params.showProgress('');
            } catch (err) {
                const errStr = `Error create payment ${err.message}`;
                console.log(errStr);
                console.log(err);
                params.showProgress('');
                params.setErrorStr(errStr);
            }
            //setDlgContent(createPaymentFunc(state, all, rowInd))

        }}> Click to create ${itemVal}</button>
    }
    if (sheetRow.invalid) {
        return <div style={{ color: 'red' }}>{ sheetRow.displayData[field]}</div>
    }
    return null;
}



export async function deleteById(id: string) {
    return api.deleteById('rentPaymentInfo', id);
}
/*
import { IPaymentWithArg, IPageInfo, IPageStates, IPageParms } from '../types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../../api'
import { IOwnerInfo, IHouseInfo, IPayment } from '../../../reportTypes';
import { keyBy, get } from 'lodash';
import moment from 'moment';

export async function getHouseState() {
    const hi = await getHouseInfo();        
    return {        
        houses: hi,
        housesByAddress: keyBy(hi, h=>h.address.toLowerCase()),
    }        
}

export const INVALID_PAYMENT_ROW_TAG = 'INVALID_PAYMENT_ROW_TAG';
export const PAYMENT_ROW_PAYMENTOBJ_TAG = 'PAYMENT_ROW_PAYMENTOBJ_TAG';

function getPaymentKey(pmt: IPayment) {        
    const date = moment(pmt.receivedDate).format('YYYY-MM-DD')        
    const amt = pmt.receivedAmount.toFixed(2);
    return `${date}-${amt}-${pmt.houseID}-${pmt.paymentID || ''}-${(pmt.paymentTypeID || '').trim()}-${(pmt.notes || '').trim()}`;
}    


export async function payment_pageLoader(importPrms: IPageParms, pageState: IPageStates) {
    const page = pageState.curPage;
    const pageDetails = pageState.pageDetails;
    let hinfo = {} as {
        [key: string]: any;
    };
    let payments = pageState.payments;                
    if (!pageState.payments || pageState.reloadPayments) {
        const hi = await getPaymentRecords();
        payments = hi.map(h => ({
            ...h,
            receivedDate: moment(h.receivedDate).format('YYYY-MM-DD'),
            processed: false, matchNotes: 'NO Match',
            invalid: false,
            invalidDesc: '',
        }));
        hinfo = {
            payments,
        }
    }
    if (!pageState.houses) {                    
        hinfo = await getHouseState();
    }
        
    //format sheet rows, fix receivedAmount to number, receivedDate to YYYY-MM-DD, houseID and added PAYMENTOBJ, with obj to IPaymentWithArg
    pageDetails.dataRows.forEach(r => {
        const pmt = page.fieldMap.reduce((acc, f) => {
            acc[f] = r[f].val;
            if (f === 'receivedAmount') {
                const amtFlt = (acc[f] as any as string).replace(/[\$, ]/g, '');
                const amt = parseFloat(amtFlt);
                acc[f] = amt;
                r[f].val = amtFlt;
            } else if (f === 'receivedDate') {
                const mt = moment(acc[f]);
                if (!mt.isValid()) {
                    acc[f] = 'Invalid';
                    r[f].val = 'Invalid: ' + acc[f];
                    r[INVALID_PAYMENT_ROW_TAG] = {
                        val: 'date',
                        obj: null,
                    };
                    acc.invalid = true;
                    acc.invalidDesc = 'date';
                } else {
                    const dateStr = moment(acc[f]).format('YYYY-MM-DD');
                    acc[f] = dateStr;
                    r[f].val = dateStr;
                }
            } 
            return acc;
        }, {} as IPaymentWithArg);
        pmt.processed = false;
        r[PAYMENT_ROW_PAYMENTOBJ_TAG] = {
            val: '',
            obj: pmt,
        };
    })

    const paymentsByDateEct = payments.reduce((acc, pmt) => {
        if (!acc[getPaymentKey(pmt)]) {
            acc[getPaymentKey(pmt)] = [];
        }
        acc[getPaymentKey(pmt)].push(pmt);
        return acc;
    }, {} as { [key: string]: IPaymentWithArg[] });

    const paymentsByHouseDMetc = payments.reduce((acc, pmt) => {
        let houseAll = acc[pmt.houseID];
        if (!houseAll) {
            houseAll = {};
            acc[pmt.houseID] = houseAll;
        }
        let hdateAll = houseAll[pmt.receivedDate];
        if (!hdateAll) {
            hdateAll = {};
            houseAll[pmt.receivedDate] = hdateAll;
        }
        if (!pmt.receivedAmount) {
            console.log(pmt)
        }
        const amountStr = pmt.receivedAmount.toFixed(2);
        let hAmtAll = houseAll[amountStr];
        if (!hAmtAll) {
            hAmtAll = {};
            houseAll[amountStr] = hAmtAll;
        }

        function addPmt(dict: { [key: string]: IPaymentWithArg[] }, key:string, pmt: IPaymentWithArg) {
            if (!dict[key]) {
                dict[key] = [];
            }
            dict[key].push(pmt);
        }
        addPmt(hdateAll, amountStr, pmt);
        addPmt(hAmtAll, pmt.receivedDate, pmt);
        return acc;
    }, {} as {
        [houseID: string]: {
            [dateOrAmt: string]: {
                [dateOrAmt: string]: IPaymentWithArg[];
            }
        }
    });

    //console.log(paymentsByHouseDMetc)

    function findPaymentByAll(pmt: IPaymentWithArg) {
        return paymentsByDateEct[getPaymentKey(pmt)];
    }
    function matchPayment(finder: (pmt:IPaymentWithArg)=>IPaymentWithArg[], matchStr: string) {
        pageDetails.rows.filter(r => !r.FOUND && !r.invalid).forEach(r => {
            const pmt = r[PAYMENT_ROW_PAYMENTOBJ_TAG].obj as IPaymentWithArg;
            //const key = getPaymentKey(pmt);
            //const foundAry = paymentsByDateEct[key];
            const foundAry = finder(pmt);
            if (!foundAry) {
                r['NOTFOUND'] = {
                    val: 'true',
                    obj: "not",
                };
                //console.log(`not found ${matchStr} for ${pmt.houseID} ${pmt.address} ${pmt.receivedDate} ${pmt.receivedAmount}`)
                return;
            }
            for (let i = 0; i < foundAry.length; i++) {
                if (foundAry[i].processed) continue;
                r['FOUND'] = {
                    val: '',
                    obj: foundAry[i],
                }
                pmt.processed = true;
                pmt.matchNotes = matchStr;
                delete r['NOTFOUND']
                return;
            }
            //console.log(`mis match found ${matchStr} for ${pmt.houseID} ${pmt.address} ${pmt.receivedDate} ${pmt.receivedAmount}`)            
            r['NOTFOUND'] = {
                val: 'true',
                obj: "not",
            };
        })
    }
    matchPayment(findPaymentByAll, "All Match");
    matchPayment(pmt => {
        return get(paymentsByHouseDMetc, [pmt.houseID, pmt.receivedAmount.toFixed(2), pmt.receivedDate]);
    }, "No Note Match");

    importPrms.dispatchCurPageState(state => {
        return {
            ...state,
            //payments,
            //paymentsByDateEct,
            pageDetails,
            ...hinfo,
            //stateReloaded: state.stateReloaded+1,
            reloadPayments: false,
        }
    });
                
}
*/