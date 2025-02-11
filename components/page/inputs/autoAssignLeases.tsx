import { orderBy } from 'lodash';
import * as api from '../../api'
import moment from 'moment';
import { getLeaseUtilForHouse } from '../../utils/leaseUtil';
function AutoAssignLeases() {    
    async function fixHouses(houseID: string) {
        const finder = await getLeaseUtilForHouse(houseID);
        const all = await finder.matchAllTransactions();
        for (const t of all) {
            if (t.leaseID) {
                await api.sqlAdd('rentPaymentInfo', t as any , false);
            }
        }
    }

    

}