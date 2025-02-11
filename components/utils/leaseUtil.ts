import { orderBy } from 'lodash';
import * as api from '../api'
import moment from 'moment';
import { ILeaseInfo } from '../reportTypes';
export async function getLeaseUtilForHouse(houseID: string) {
    const allLeases = orderBy(await api.getLeases({
        whereArray: [{
            field: 'houseID',
            op: '=',
            val: houseID,
        }]
    }), r => r.startDate, 'desc');


    function findLeaseForDate(date: string): ILeaseInfo {
        const pd = moment(date);
        for (const l of allLeases) {
            if (moment(l.startDate).isBefore(pd)) {
                return l;
            }
        }
        return null;
    }
    async function matchAllTransactions() {
        const unleasedPayments = await api.getPaymnents({
            whereArray: [
                {
                    field: 'leaseID',
                    op: 'isNULL',
                    val: null,
                },
                {
                    field: 'houseID',
                    op: '=',
                    val: houseID,
                }
            ]
        });
    
        unleasedPayments.forEach(p => {
            const l = findLeaseForDate(p.receivedDate);
            if (l) {
                p.leaseID = l.leaseID;
            }
        });
        return unleasedPayments;
    }

    return {
        findLeaseForDate,
        matchAllTransactions,
    }
}