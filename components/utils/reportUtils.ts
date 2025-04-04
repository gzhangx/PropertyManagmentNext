import moment from "moment";
import { IExpenseData, IHelperOpts, IHouseInfo, IMaintenanceRawData, IPageRelatedState, IPayment } from "../reportTypes";
import { IRootPageState } from "../states/RootState";
import { IDBFieldDef } from "../types";
import { createAndLoadHelper } from "../uidatahelpers/datahelpers";



export type IPaymentWithDateMonthPaymentType = IPayment & {
    date: string;
    month: string;
    paymentTypeName: string;
    address: string;
    addressObj: IHouseInfo;
}

export async function loadPayment(rootCtx: IRootPageState, mainCtx: IPageRelatedState, opts: IHelperOpts) {
    const helper = await createAndLoadHelper(rootCtx, mainCtx, {
        table: 'rentPaymentInfo'
    });
    await helper.loadModel();
    const fieldToDefDict = helper.getModelFields().reduce((acc, f) => {
        acc[f.field] = f;
        return acc;
    }, {} as {[field: string]: IDBFieldDef});
    await mainCtx.checkLoadForeignKeyForTable('rentPaymentInfo');
    
    const paymentData: IPaymentWithDateMonthPaymentType[] = await helper.loadData(opts).then(async res => {        
        return res.rows.map(r => {
            const paymentTypeName = r.paymentTypeName || r.paymentTypeID;
            const date = mainCtx.utcDbTimeToZonedTime(r.receivedDate);

            const pmt: IPaymentWithDateMonthPaymentType = {
                ...r,
                paymentTypeName,
                date,
                month: moment(date).format('YYYY-MM'),
                amount: r.receivedAmount,
            };
            ['receivedDate'].forEach(f => {
                const tmField = fieldToDefDict['houseID'];
                if (tmField.foreignKey && tmField.foreignKey.resolvedToField) {
                    const houseInfo = mainCtx.translateForeignLeuColumnToObject(tmField, r);
                    pmt[tmField.foreignKey.resolvedToField] = houseInfo as IHouseInfo;

                    if (typeof houseInfo === 'string') {
                        pmt.address = 'NonReslvedAddr ' + houseInfo
                    } else {
                        pmt.address = houseInfo.address as string;
                    }
                }
            });            
            return pmt;
        })
    });
    return paymentData;
}


type GenLoaderFunc = (rootCtx: IRootPageState, mainCtx: IPageRelatedState, opts: IHelperOpts) => Promise<any[]>;
export async function loadMaintenanceData(rootCtx: IRootPageState, mainCtx: IPageRelatedState, opts: IHelperOpts) {
    const helper = await createAndLoadHelper(rootCtx, mainCtx, {
        table: 'maintenanceRecords'
    });
    await helper.loadModel();
    await mainCtx.checkLoadForeignKeyForTable('maintenanceRecords');
    const data = await helper.loadData(opts);
    return data.rows.map(r => {
        const expenseCategoryName = r.expenseCategoryName || r.expenseCategoryId;
        return {
            ...r,
            utcDate: r.date,
            date: mainCtx.utcDbTimeToZonedTime(r.date),
            expenseCategoryName,
        } as IExpenseData
    });
}

export async function loadDataWithMonthRange(rootCtx: IRootPageState, mainCtx: IPageRelatedState, loader: GenLoaderFunc, selectedMonths: string[], dateField: 'receivedDate', comment: string) {
    const startDate = mainCtx.browserTimeToUTCDBTime(selectedMonths[0] + '-01');
    const endDate = mainCtx.browserTimeToUTCDBTime(moment(selectedMonths[selectedMonths.length - 1] + '-01'));
    console.log(`loadData for ${comment} startDate: ${startDate}, endDate: ${endDate}`);
    const data = await loader(rootCtx, mainCtx, {
        whereArray: [
            {
                field: dateField,
                op: '>=',
                val: startDate,
            },
            {
                field: dateField,
                op: '<',
                val: endDate,
            }
        ],
    });
    return data;
}



export type MonthSelections = 'LastMonth' | 'Last3Month' | 'Y2D' | 'LastYear' | 'All';
export function getMonthAry(monSel: MonthSelections) {

    let lm: string;
    switch (monSel) {
        case 'LastMonth':
            return [moment().subtract(1, 'month').format('YYYY-MM')];
        case 'Last3Month':
            return [0, 1, 2].map(sub => moment().subtract(sub, 'month').format('YYYY-MM'))

        case 'Y2D':
            {
                let start = moment().startOf('year');
                const now = moment();
                const result: string[] = [];
                while (start.isSameOrBefore(now)) {
                    result.push(start.format('YYYY-MM'));
                    start.add(1, 'month');
                }
                return result;
            }
        case 'LastYear':
            {
                const end = moment().startOf('year');
                const start = end.clone().subtract(1, 'year');
                const result: string[] = [];
                while (start.isBefore(end)) {
                    result.push(start.format('YYYY-MM'));
                    start.add(1, 'month');
                }
                return result;
            }
        default:
            return [];
    }
}


export function formatAccounting(number: number | string) {
    const num = Number(number);
    if (isNaN(num)) {
      return 'Invalid Input';
    }
  
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'symbol',
    }).format(num);
  
    return num < 0 ? `(${formatted.replace('-', '')})` : formatted;
  }