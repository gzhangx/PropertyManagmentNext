import { sqlAdd, } from '../../../api'
import { IDbInserter, } from '../types'
import { TableNames } from '../../../types'

export function getDbInserter(name: TableNames): IDbInserter {
    return {
        name,
        createEntity: saveData => {
            return sqlAdd(name,
                saveData, true
            ).then(res => {
                console.log(`sql add ${name}`, res);
                return res;
            })
        }
    };
}