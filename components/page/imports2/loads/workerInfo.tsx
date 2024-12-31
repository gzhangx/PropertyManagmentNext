
import { getWorkerInfo } from '../../../api';
import {  ICompRowData, IDbRowMatchData, IDbSaveData, IDisplayColumnInfo, IPageInfo, IPageStates, IRowComparer, ISheetRowData, IStringDict, } from '../types'
import { IWorkerInfo } from '../../../reportTypes';
import { ALLFieldNames } from '../../../uidatahelpers/datahelperTypes';
import * as allDefs from '../../../uidatahelpers/defs/allDefs';
const workerFields = ['workerID', 'workerName',
]

const WorkerRowCompare: IRowComparer[] = [
    {
        name: 'Worker Row Comparer',
        getRowKey: (data: IDbSaveData) => { 
            const hi = data as any as IWorkerInfo;
            const matches = fieldMap.filter(f => f).map(f => (hi[f] || '').trim());
            return matches.join('-');
        },
    }
];


const displayColumnInfo: IDisplayColumnInfo[] = [
    {
        field: 'workerName',
        name: 'Worker Name',
    },
    {
        field: 'taxName',
        name: 'Tax Name',
    },
    {
        field: 'taxID',
        name: 'SSN',
    },
    {
        field: 'address',
        name: 'Address'
    },
    {
        field: 'city',
        name: 'City'
    },
    {
        field: 'zip',
        name: 'Zip'
    },
    {
        field: 'ownerName',
        name: 'Owner'
    },
];

const fieldMap: ALLFieldNames[]=[
    'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip',
    '', //contact
    'email',
    'phone',
]
export const workerInfo: IPageInfo = {
    ...allDefs.workerInfoDef,
    //pageName: 'Workers Info',
    //range: 'A1:K',
    //tableName: 'workerInfo',
    //fieldMap,
    dbLoader: () => getWorkerInfo().then(r => r as any as IDbSaveData[]),
    //rowComparers: WorkerRowCompare,
    showCreateButtonColumn: 'workerName',
    displayColumnInfo,
    sheetMustExistField: 'workerName',
    //dbInserter: inserter.getDbInserter('workerInfo'),
    //custProcessSheetData,
};