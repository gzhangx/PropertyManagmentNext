
import { IHouseInfo } from '../../../reportTypes';
import { IDbSaveData, IRowComparer, IStringDict } from '../types'

export const HouseRowCompare: IRowComparer[] = [
    {
        name: 'House Row Comparer',
        getRowKey: (data: IDbSaveData) => { 
            const hi = data as any as IHouseInfo;
            return hi.address;
        },
    }
];