import { IDbSaveData, IRowComparer,  ISheetRowData, IPageParms, IDbRowMatchData, IPageInfo } from '../types'
// import { IMaintenanceRawData } from '../../../reportTypes';

// import { IPageStates } from '../types';
// import { getRelatedTableByName, ICmpItemByName } from './cmpUtil';

// import * as lutil from './util';
// import moment from 'moment';
import * as theApi from '../../../api'


// import type { JSX } from "react";
// import { ALLFieldNames } from '../../../uidatahelpers/datahelperTypes';
import * as allDefs from '../../../uidatahelpers/defs/allDefs';
// function fixDates(date: string): string {
//     const mnt = moment(date);
//     if (mnt.isValid()) return mnt.format('YYYY-MM-DD');
//     return date;
// }
// export const maintenanceRowCompare: IRowComparer[] = [
//     {
//         name: 'Maintenance Row Comparer',
//         getRowKey: (data: IDbSaveData, source) => {
//             const le = data as any as IMaintenanceRawData;
//             let amt: any = le.amount;
//             if (typeof amt === 'number') {
//                 amt = amt.toFixed(2);
//                 //console.log(`'${source}' type of amt ${typeof amt}`, amt)
//             } else {
//                 //console.log(`'${source}' type of amt ${typeof amt}`,amt)
//             }
//             const date = fixDates(le.date);            
//             const key = `a=${amt}:d=${date}:hid=${le.houseID}:wid=${(le.workerID || '')}:expCat=${(le.expenseCategoryId)}:cmt=${(le.comment)}`;
//             console.log(`key(${source})====`,key)
//             //if (source === 'DB') console.log('tempshow db data', data);
//             return key;
//         },
//         checkRowValid(data) {
//             const le = data as any as IMaintenanceRawData;
//             //if (!le.workerID) return 'worker not saved';
//             if (!le.expenseCategoryId) return 'no expenseCategory';
//             if (!le.houseID) return 'House Not Saved'
//             return null;
//         },
//     }
// ];


// interface IMaintenanceCustomData {
//     //workersByName: ICmpItemByName;
//     //expenseCategoriesByName: ICmpItemByName;
//     housesByName: ICmpItemByName;
// }

// function fixManintenceData(dataInput: ISheetRowData, pageState: IPageStates) {
//     const data = dataInput.importSheetData;
//     const leaseCustData = pageState.pageDetails.customData as IMaintenanceCustomData;
//     if (!data['houseID']) {
//         const houseKey = lutil.getStdLowerName(data['maintenanceImportAddress'].toString());
//         const matched = leaseCustData.housesByName[houseKey];
//         if (!matched) return;
//         if (matched.matched) {
//             data['houseID'] = matched.matched['houseID'];
//             //console.log('matched tenantID is ', data['tenantID'])
//         }
//     }
// }

// export async function maintenanceExtraProcessSheetData(datasInput: ISheetRowData[], pageState: IPageStates): Promise<ISheetRowData[]> {
//     const housesByName = await getRelatedTableByName(pageState, 'House Info');
//     //const workersByName = await getRelatedTableByName(pageState, '');
//     pageState.pageDetails.customData = {        
//         housesByName,
//     } as IMaintenanceCustomData;
    

//     const datas: ISheetRowData[] = datasInput.reduce((acc, data) => {
        
//         const address = data.importSheetData['maintenanceImportAddress'];
//         if (address) {            
//             fixManintenceData(data, pageState);
//                 acc.push({
//                     ...data,
//                     importSheetData: {
//                         ...data.importSheetData,
//                     }
//                 })
//             }
        
//         return acc;
//     }, []);

//     console.log('extraprocess maintenance=', datas)
//     return datas;
// }

// export function displayItem(params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames): JSX.Element {
//     if (field === 'startDate') return null;
//     const displayStrValue = sheetRow.displayData[field];
//     const tnameTag = lutil.getStdLowerName(displayStrValue?.toString());
//     if (field === 'address') {
//         const houseID = sheetRow.importSheetData['houseID'];
//         if (!houseID) {
//             return <div>{displayStrValue} (!!No sheet value)</div>;
//         } 
//     }
//     return <div>{displayStrValue}</div>;
// }

// export function displayDbExtra(params: IPageParms, state: IPageStates, dbMatch: IDbRowMatchData, field: ALLFieldNames) {
//     if (field === 'address') {
//         return <button className='btn btn-primary' onClick={() => {
//             const maintenanceID = dbMatch.dbItemData['maintenanceID'] as string;
//             console.log('delete', maintenanceID)
//             /*
//             api.deleteLeases(maintenanceID).then(res => {
//                 console.log('delete got', res);
//                 const newdbMatchData = state.pageDetails.dbMatchData.filter(d => d.dbItemData['leaseID'] !== leaseID)
//                 params.dispatchCurPageState(state => ({
//                     ...state,
//                     pageDetails: {
//                         ...state.pageDetails,
//                         dbMatchData: newdbMatchData,
//                     }
//                 }))
//             })
//             */
//         }}>Delete({dbMatch.dbItemData[field]} (NOT IMPLEMENTED))</button>
//     }
//     return dbMatch.dbItemData[field];
// }



export const maintenceRecordDef: IPageInfo = {
    //tableName: 'maintenanceRecords',
    //pageName: 'MaintainessRecord',
    //range: 'A1:G',
    ...allDefs.maintenanceInfoDef,    
    /*
    displayColumnInfo: [
        {
            field: 'date',
            name: 'Date',
        },
        {
            field: 'description',
            name: 'Description',
        },
        {
            field: 'amount',
            name: 'Amount',
        },
        {
            field: 'houseID',
            name: 'Address',
        },
        {
            field: 'expenseCategoryId',
            name: 'ExpenseCategoryId',
        },
        {
            field: 'workerID',
            name: 'Worker',
        },
        {
            field: 'comment',
            name: 'Comment',
        },
    ],
    */
    sheetMustExistField: 'date',
    //rowComparers: maintenanceRowCompare,
    dbLoader: () => theApi.getMaintenanceReport().then(r => r.rows as unknown as IDbSaveData[]),
    //extraProcessSheetData: maintenanceExtraProcessSheetData,
    showCreateButtonColumn: 'houseID',
    //dbInserter: inserter.getDbInserter('maintenanceRecords'),
    //dbItemIdField: 'maintenanceID',
    //deleteById: id => theApi.deleteById('maintenanceRecords', id),
};