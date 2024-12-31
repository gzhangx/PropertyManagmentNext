
import { getHouseInfo } from '../../../api';
import { IDbSaveData, IPageInfo, } from '../types'
import * as allDefs from '../../../uidatahelpers/defs/allDefs';

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
    sheetMustExistField: 'houseID',
    //dbInserter: inserter.getDbInserter('houseInfo'),
};