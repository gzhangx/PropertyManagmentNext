
import { getWorkerInfo } from '../../../api';
import { ALLFieldNames, ICompRowData, IDbRowMatchData, IDbSaveData, IDisplayColumnInfo, IPageInfo, IPageStates, IRowComparer, ISheetRowData, IStringDict, } from '../types'
import * as inserter from '../loads/inserter';
import { IWorkerInfo } from '../../../reportTypes';

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

function custProcessSheetData(sheetData: ICompRowData[], pageState: IPageStates): IStringDict[] {
    const fieldNames = pageState.curPage.fieldMap.filter(f => f);
    return sheetData.map(sd => {
        const acc = (sd as ISheetRowData).importSheetData || (sd as IDbRowMatchData).dbItemData;
        const displayData = fieldNames.reduce((acc, fieldName) => {
                let dsp = acc[fieldName];
                if (dsp === 0) {
                    acc[fieldName] = dsp;
                    return acc;
                }
                if (!dsp) {
                    acc[fieldName] = '';
                    return acc;
                }                                
                return acc;
            }, {...acc});
        sd.displayData = displayData;
        return displayData;
    });
}

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
    pageName: 'Workers Info',
    range: 'A1:K',
    fieldMap,
    dbLoader: () => getWorkerInfo().then(r => r as any as IDbSaveData[]),
    rowComparers: WorkerRowCompare,
    shouldShowCreateButton: colInfo => colInfo.field === 'workerName',
    displayColumnInfo,
    sheetMustExistField: 'workerName',
    dbInserter: inserter.getDbInserter('workerInfo'),
    custProcessSheetData,
};