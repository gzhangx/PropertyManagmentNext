import { orderBy } from 'lodash';
import * as api from '../../components/api'
import moment from 'moment';
import { getLeaseUtilForHouse } from '../../components/utils/leaseUtil';
import { IHouseInfo } from '../../components/reportTypes';
import { useEffect, useState } from 'react';
export function AutoAssignLeases() {    
    async function fixHouses(houseID: string) {
        const finder = await getLeaseUtilForHouse(houseID);
        const all = await finder.matchAllTransactions();
        for (const t of all) {
            if (t.leaseID) {
                await api.sqlAdd('rentPaymentInfo', t as any , false);
            }
        }
    }

    const [houses, setHouses] = useState<IHouseInfo[]>([]);
    useEffect(() => {
        api.getHouseInfo().then(houses => {
            setHouses(houses);
        })
    }, []);
    return <div>
        <table className="table">
            <thead>
                <tr>
                    <th scope="col">House</th>
                    <th>City</th>
                    <th>Owner</th>
                    <th>Id</th>
                </tr>
            </thead>
            <tbody>
                {
                    houses.map(house => {
                        return <tr><td>{house.address}</td><td>{ house.city}</td><td>{house.ownerName}</td><td>{house.houseID}</td></tr>
                    })               
                }
            </tbody>
        </table>
    </div>

}