import * as api from '../../components/api'
import { getLeaseUtilForHouse } from '../../components/utils/leaseUtil';
import { IHouseInfo, ILeaseInfo, IPayment } from '../../components/reportTypes';
import { useEffect, useState } from 'react';
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
import moment from 'moment';
import { orderBy } from 'lodash';
export function AutoAssignLeases() {
        

    const mainCtx = usePageRelatedContext();
    const setTopBarMessages = mainCtx.topBarMessagesCfg.setTopBarItems;
    const setTopBarErrors = mainCtx.topBarErrorsCfg.setTopBarItems;
    const [houses, setHouses] = useState<IHouseInfo[]>([]);
    const [processingHouseId, setProcessingHouseId] = useState('');
    const [disableProcessing, setDisableProcessing] = useState(false);
    async function fixHouses(houseID: string) {
        setProcessingHouseId(houseID);
        const finder = await getLeaseUtilForHouse(houseID);
        const all = await finder.matchAllTransactions();
        setTopBarMessages(state => {
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
                setTopBarMessages(state => {
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

    async function processAllHouses() {
        setTopBarMessages([
            { header: 'Process all' }
        ]);
        setTopBarErrors([]);
        setDisableProcessing(true);
        for (const house of houses) {
            await fixHouses(house.houseID);
        }
        setDisableProcessing(false);
    }
    useEffect(() => {
        setTopBarMessages([
            { header: 'Houses Loaded' }
        ]);
        setTopBarErrors([]);
        api.getHouseInfo().then(houses => {
            setHouses(houses);
            setTopBarMessages(state => {
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
                    <th scope="col"><button className='btn btn-primary' disabled={disableProcessing} onClick={processAllHouses}>House Process All</button></th>
                    <th>City</th>
                    <th>Owner</th>
                    <th>Id</th>
                </tr>
            </thead>
            <tbody>
                {
                    houses.map(house => {
                        return <tr>
                            <td><button className='btn btn-primary' onClick={async () => {
                                setTopBarMessages([
                                    {header: `House ${house.address}`}
                                ]);
                                const finder = await getLeaseUtilForHouse(house.houseID);
                                const lease = await finder.findLeaseForDate(new Date());
                                if (!lease) {
                                    setTopBarErrors(state => {
                                        return [
                                            ...state,
                                            {
                                                clsColor: 'bg-warning',
                                                clsIcon: 'fa-donate',
                                                //subject: 'December 7, 2021',
                                                text: 'Cant find leases'
                                            }
                                        ];
                                    })
                                    return;
                                }
                                const payments = await finder.loadLeasePayments(lease);
                                const leaseBalance = finder.calculateLeaseBalances(lease, payments, 3, new Date());

                                leaseBalance.monthlyInfo.reverse();
                                for (let i = 0; i < 2; i++) {
                                    const mi = leaseBalance.monthlyInfo[i];
                                    if (mi) {
                                        setTopBarMessages(state => {
                                            return [...state, {
                                                clsColor: 'bg-success',
                                                clsIcon: 'fa-donate',
                                                //subject: 'December 7, 2021',
                                                text: `${mi.month} balance=${mi.balance}`
                                            }]
                                        });
                                    }
                                }
                            }}>{house.address}</button> </td>
                            <td>{house.city}</td><td>{house.ownerName}</td><td className={processingHouseId === house.houseID ? 'bg-warning' : ''}>{house.houseID}</td>
                            <td><button disabled={disableProcessing} className='btn btn-primary'
                            onClick={() => {
                                setDisableProcessing(true);
                                fixHouses(house.houseID).then(() => setDisableProcessing(false))
                            }}
                        >Fix</button></td></tr>
                    })               
                }
            </tbody>
        </table>
    </div>

}