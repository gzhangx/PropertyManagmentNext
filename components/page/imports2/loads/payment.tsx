
import { IPayment } from '../../../reportTypes';
import { IDbSaveData, IRowComparer, YYYYMMDDFormater, IPageStates, ISheetRowData, ALLFieldNames, IPageParms } from '../types'

import * as api from '../../../api';

import type { JSX } from "react";

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
        let invalidInfo = '';
        if (!sheetRow.needUpdate) invalidInfo = 'No Need to update ';
        if (sheetRow.invalid) invalidInfo += ' Invalid: ' + sheetRow.invalid; 
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

        }}> Click to create p(${itemVal}) {invalidInfo}</button>
    }
    if (sheetRow.invalid) {
        return <div style={{ color: 'red' }}>{ sheetRow.displayData[field]}</div>
    }
    return null;
}



export async function deleteById(id: string) {
    return api.deleteById('rentPaymentInfo', id);
}
