import { sqlAdd, } from '../../../api'
import { IDbInserter, } from '../types'
import { TableNames} from '../../../types'
export const PaymentDbInserter: IDbInserter = {
    name: 'Payment inserter',
    createEntity: saveData => {
        return sqlAdd('rentPaymentInfo',
            saveData, true
        ).then(res => {
            console.log('sql add payment', res);
            return res;
        })
    }
}


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