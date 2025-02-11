// import { IDbSaveData, IRowComparer, IStringDict, ISheetRowData, IPageDataDetails } from '../types'
// import { ITenantInfo } from '../../../reportTypes';
// import * as lutils from './util';

// export const TenantRowCompare: IRowComparer[] = [
//     {
//         name: 'Tenant Row Comparer',
//         getRowKey: (data: IDbSaveData) => {
//             const hi = data as any as ITenantInfo;
//             return lutils.getStdLowerName(hi.fullName);
//         },
//     }
// ];

// export async function extraProcessSheetData(datas: ISheetRowData[]) {
//     datas.forEach(data => {
//         const full = (data.importSheetData['firstName'] || '') + ' ' + (data.importSheetData['lastName'] || '').toString().trim();
//         data.importSheetData['fullName'] = full;
//         data.displayData['fullName'] = full;
//     })
//     return datas;
// }




import { getTenants } from '../../../api';
import { IDbSaveData, IPageInfo, } from '../types'
import * as allDefs from '../../../uidatahelpers/defs/allDefs';

export const tenantPageInfo: IPageInfo = {
    ...allDefs.tenantInfoDef,
    //pageName: 'House Info',
    //tableName: 'houseInfo',
    //range: 'A1:I',    
    dbLoader: () => getTenants().then(r => r as any as IDbSaveData[]),
    //rowComparers: HouseRowCompare,
    showCreateButtonColumn: 'tenantID',
    displayColumnInfo: [
        {
            field: 'fullName',
            name: 'FullName'
        },
        {
            field: 'phone',
            name: 'Phone'
        },
        {
            field: 'email',
            name: 'Email'
        },        
    ],
    sheetMustExistField: 'tenantID',
    //dbInserter: inserter.getDbInserter('houseInfo'),
};