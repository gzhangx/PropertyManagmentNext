
import { getWorkerInfo } from '../../../api';
import { IDbSaveData, IDisplayColumnInfo, IPageInfo,  } from '../types'
import * as allDefs from '../../../uidatahelpers/defs/allDefs';


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