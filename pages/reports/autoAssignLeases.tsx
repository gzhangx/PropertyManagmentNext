import { orderBy } from 'lodash';
import * as api from '../../components/api'
import moment from 'moment';
import { getLeaseUtilForHouse } from '../../components/utils/leaseUtil';
import { IHouseInfo } from '../../components/reportTypes';
import { useEffect, useState } from 'react';
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
export function AutoAssignLeases() {    
    async function fixHouses(houseID: string) {
        const finder = await getLeaseUtilForHouse(houseID);
        const all = await finder.matchAllTransactions();
        mainCtx.setTopBarMessages(state => {
            return [...state, {
                clsColor: 'bg-success',
                clsIcon: 'fa-donate',
                //subject: 'December 7, 2021',
                text: `Found ${all.length} payments for house`
            }]
        });
        for (const t of all) {
            if (t.leaseID) {
                await api.sqlAdd('rentPaymentInfo', t as any, false);
                const lease = finder.allLeases.find(l => l.leaseID === t.leaseID);
                mainCtx.setTopBarMessages(state => {
                    return [...state, {
                        clsColor: 'bg-success',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Set lease ${t.leaseID} ${lease.startDate} ${lease.endDate} to ${t.houseID} ${t.receivedAmount}`
                    }]
                });
            }
        }
    }

    const mainCtx = usePageRelatedContext();
    const [houses, setHouses] = useState<IHouseInfo[]>([]);
    useEffect(() => {
        mainCtx.setTopBarMessages([
            { header: 'Houses Loaded' }
        ]);
        api.getHouseInfo().then(houses => {
            setHouses(houses);
            mainCtx.setTopBarMessages(state => {
                return [...state, {
                    clsColor: 'bg-success',
                    clsIcon: 'fa-donate',
                    //subject: 'December 7, 2021',
                    text: 'Loaded ' + houses.length
                }]
            });
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
                        return <tr><td>{house.address}</td><td>{house.city}</td><td>{house.ownerName}</td><td>{house.houseID}</td><td><button className='btn btn-primary'
                            onClick={() => {
                                fixHouses(house.houseID)
                            }}
                        >Fix</button></td></tr>
                    })               
                }
            </tbody>
        </table>
    </div>

}