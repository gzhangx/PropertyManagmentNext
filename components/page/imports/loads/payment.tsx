

import { IBasicImportParams, IPaymentWithArg, IPageInfo, IItemData, IDataDetails, IPageStates } from '../types'
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

function getPaymentKey(pmt: IPayment) {        
    const date = moment(pmt.receivedDate).format('YYYY-MM-DD')        
    const amt = pmt.receivedAmount.toFixed(2);
    return `${date}-${amt}-${pmt.houseID}-${pmt.paymentID || ''}-${(pmt.paymentTypeID || '').trim()}-${(pmt.notes || '').trim()}`;
}    


export async function payment_pageLoader(importPrms: IBasicImportParams, pageState: IPageStates) {
    const page = pageState.curPage;
    const pageDetails = pageState.pageDetails;
    let hinfo = {} as {
        [key: string]: any;
    };
    let payments = pageState.payments;                
    if (!pageState.payments || pageState.reloadPayments) {
        const hi = await getPaymentRecords();
        payments = hi.map(h => ({ ...h, processed: false, matchNotes:'NO Match' }));
        hinfo = {
            payments,
        }
    }
    if (!pageState.houses) {                    
        hinfo = await getHouseState();
    }
        
    //format sheet rows, fix receivedAmount to number, receivedDate to YYYY-MM-DD, houseID and added PAYMENTOBJ, with obj to IPaymentWithArg
    pageDetails.rows.forEach(r => {
        const pmt = page.fieldMap.reduce((acc, f) => {
            acc[f] = r[f].val;
            if (f === 'receivedAmount') {
                const amtFlt = (acc[f] as any as string).replace(/[\$, ]/g, '');
                const amt = parseFloat(amtFlt);
                acc[f] = amt;
                r[f].val = amtFlt;
            } else if (f === 'receivedDate') {
                const dateStr = moment(acc[f]).format('YYYY-MM-DD');
                acc[f] = dateStr;
                r[f].val = dateStr;
            } else if (f === 'houseID') {
                const house = pageState.getHouseByAddress(pageState, acc[f]);
                if (house) {
                    acc['address'] = acc[f];
                    acc['houseID'] = house.houseID;
                    acc['ownerID'] = house.ownerID;
                }
            }
            return acc;
        }, {} as IPaymentWithArg);
        pmt.processed = false;
        r['PAYMENTOBJ'] = {
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

    function findPaymentByAll(pmt: IPaymentWithArg) {
        return paymentsByDateEct[getPaymentKey(pmt)];
    }
    function matchPayment(finder: (pmt:IPaymentWithArg)=>IPaymentWithArg[], matchStr: string) {
        pageDetails.rows.filter(r => !r.FOUND).forEach(r => {
            const pmt = r['PAYMENTOBJ'].obj as IPaymentWithArg;
            //const key = getPaymentKey(pmt);
            //const foundAry = paymentsByDateEct[key];
            const foundAry = finder(pmt);
            if (!foundAry) {
                r['NOTFOUND'] = {
                    val: 'true',
                    obj: "not",
                };
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
                return;
            }
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