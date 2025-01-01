import { sqlAdd, } from '../../../api'
import { IDbInserter, } from '../types'
import { TableNames } from '../../../types'

export function getDbInserter(name: TableNames, doCreate: boolean): IDbInserter {
    return {
        name,
        createEntity: saveData => {
            return sqlAdd(name,
                saveData, doCreate
            ).then(res => {
                console.log(`sql add ${name}`, res);
                return res;
            })
        }
    };
}