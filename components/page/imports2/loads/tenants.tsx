import { IDbSaveData, IRowComparer, IStringDict, ISheetRowData, IPageDataDetails } from '../types'
import { ITenantInfo } from '../../../reportTypes';
import * as lutils from './util';

export const TenantRowCompare: IRowComparer[] = [
    {
        name: 'Tenant Row Comparer',
        getRowKey: (data: IDbSaveData) => {
            const hi = data as any as ITenantInfo;
            return lutils.getStdLowerName(hi.fullName);
        },
    }
];

export async function extraProcessSheetData(datas: ISheetRowData[]) {
    datas.forEach(data => {
        const full = (data.importSheetData['firstName'] || '') + ' ' + (data.importSheetData['lastName'] || '').toString().trim();
        data.importSheetData['fullName'] = full;
        data.displayData['fullName'] = full;
    })
    return datas;
}
