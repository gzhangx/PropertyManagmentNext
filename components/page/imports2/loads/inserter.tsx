import { sqlAdd, } from '../../../api'
import { IDbInserter, } from '../types'
import { TableNames } from '../../../types'
import { IPageRelatedState } from '../../../reportTypes';

export function getDbInserter(pageCtx: IPageRelatedState, name: TableNames, doCreate: boolean): IDbInserter {
    return {
        name,
        createEntity: saveData => {
            const fields = pageCtx.modelsProp.getTableModelSync(name);
            for (const fld of fields) {
                if (fld.type === 'datetime') {
                    saveData[fld.field] = pageCtx.browserTimeToUTCDBTime(saveData[fld.field] as string);
                }
            }
            return sqlAdd(name,
                saveData as any, doCreate
            ).then(res => {
                console.log(`sql add ${name}`, res);
                return res;
            })
        }
    };
}