
import { getHouseInfo } from '../../../api';
import { IHouseInfo } from '../../../reportTypes';
import { IDbSaveData, IPageInfo, IRowComparer, } from '../types'
import * as allDefs from '../../../uidatahelpers/defs/allDefs';
const HouseRowCompare: IRowComparer[] = [
    {
        name: 'House Row Comparer',
        getRowKey: (data: IDbSaveData) => { 
            const hi = data as any as IHouseInfo;
            return (hi.address || '').toLowerCase().trim();
        },
    }
];


export const housePageInfo: IPageInfo = {
    ...allDefs.houseInfoDef,
    //pageName: 'House Info',
    //tableName: 'houseInfo',
    //range: 'A1:I',    
    dbLoader: () => getHouseInfo().then(r => r as any as IDbSaveData[]),
    //rowComparers: HouseRowCompare,
    showCreateButtonColumn: 'address',
    displayColumnInfo: [
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
    ],
    sheetMustExistField: 'address',
    //dbInserter: inserter.getDbInserter('houseInfo'),
};