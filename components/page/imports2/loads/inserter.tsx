import { sqlAdd } from '../../../api'
import { IDbInserter,  } from '../types'
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