import * as api from '../../components/api'
import { getLeaseUtilForHouse, ILeaseInfoWithPmtInfo } from '../../components/utils/leaseUtil';
import { IHouseInfo, ILeaseInfo } from '../../components/reportTypes';
import { useEffect, useState } from 'react';
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
import Link from 'next/link';
import { formateEmail, HouseWithLease } from '../../components/utils/leaseEmailUtil';


export function getLeasePage() {
    return <AutoAssignLeases></AutoAssignLeases>
}
export default function AutoAssignLeases() {
        

    const mainCtx = usePageRelatedContext();
    const setTopBarMessages = mainCtx.topBarMessagesCfg.setTopBarItems;
    const setTopBarErrors = mainCtx.topBarErrorsCfg.setTopBarItems;
    const [houses, setHouses] = useState<HouseWithLease[]>([]);
    const [processingHouseId, setProcessingHouseId] = useState('');
    const [disableProcessing, setDisableProcessing] = useState(false);

    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});
    async function fixHouses(house: HouseWithLease) {
        const houseID = house.houseID;
        setProcessingHouseId(houseID);
        const finder = await getLeaseUtilForHouse(houseID);
        const all = await finder.matchAndAddLeaseToTransactions((pos, pmt) => {
            if (!pmt) {
                setTopBarMessages(state => {
                    return [...state, {
                        clsColor: 'bg-success',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Found ${pos} payments for house`
                    }]
                });
            } else {
                const lease = finder.allLeases.find(l => l.leaseID === pmt.leaseID);
                setTopBarMessages(state => {
                    return [...state, {
                        clsColor: 'bg-success',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Set lease ${pmt.leaseID} ${lease.startDate} ${lease.endDate} to ${pmt.houseID} ${pmt.receivedAmount}`,
                    }]
                });
            }
        });

        const noLeases = all.filter(t => !t.leaseID);
        if (noLeases.length) {
            setTopBarErrors(noLeases.map(t => {
                return {
                    clsColor: 'bg-warn',
                    clsIcon: 'fa-donate',
                    //subject: 'December 7, 2021',
                    text: `Unable to find lease for payment ${t.receivedAmount} ${t.receivedDate} addr=${t.address} house=${t.houseID}`
                }
            }));    
        }
        
        const lease = await finder.findLeaseForDate(new Date());
        house.lease = lease;
        return lease;
    }

    async function processAllHouses() {
        setTopBarMessages([
            { header: 'Process all' }
        ]);
        setTopBarErrors([]);
        setDisableProcessing(true);
        for (const house of houses) {
            await fixHouses(house);
            await processOneHouse(house);
        }
        setHouses(houses);
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



    const processOneHouse = async (house: HouseWithLease, expand = false) => {
        if (house.leaseInfo) {
            const leaseID = house.lease.leaseID;
            if (expand) {
                setLeaseExpanded({
                    ...leaseExpanded,
                    [leaseID]: !leaseExpanded[leaseID],
                })
                return;
            }            
        }
        if (expand) {
            setTopBarMessages([
                { header: `House ${house.address}` }
            ]);
        }
        setProcessingHouseId(house.houseID);
        const lease = await gatherLeaseInfomation(house);

        if (lease === 'Lease not found') {
            setTopBarErrors(state => {
                return [
                    ...state,
                    {
                        clsColor: 'bg-warning',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Cant find leases ${house.address}`
                    }
                ];
            })
            return;
        }
        const leaseID = lease.lease.leaseID;
        if (leaseExpanded[leaseID]) {
            setLeaseExpanded({
                ...leaseExpanded,
                [leaseID]: false,
            });
            return;
        }

        const leaseBalance = lease.leaseBalance;
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

        setHouses(houses);

        if (expand) {
            setLeaseExpanded({
                ...leaseExpanded,
                [leaseID]: !leaseExpanded[leaseID],
            });
        }
    }
    
    return <div>
        <table className="table">
            <thead>
                <tr>
                    <th scope="col"><button className='btn btn-primary' disabled={disableProcessing} onClick={processAllHouses}>House Process All</button></th>
                    <th></th>
                    <th>Balance</th>
                    <th>Owner</th>
                    <th>Id</th>
                </tr>
            </thead>
            <tbody>
                {
                    houses.map(house => {
                        return <><tr>
                            <td>{house.address} </td><td>
                                <button className='btn btn-primary' onClick={()=>processOneHouse(house, true)}>E</button>
                            </td>
                            <td>{house.leaseInfo? house.leaseInfo.totalBalance : 'NA'}</td><td>{house.ownerName}</td><td className={processingHouseId === house.houseID ? 'bg-warning' : ''}>{house.houseID}</td>
                            <td><button disabled={disableProcessing} className='btn btn-primary'
                            onClick={() => {
                                setDisableProcessing(true);
                                fixHouses(house).then(() => {
                                    setHouses(houses);
                                    setDisableProcessing(false);
                                })
                            }}
                            >Fix</button></td>                            
                        </tr>
                        {
                            house.lease && leaseExpanded[house.lease.leaseID] && house.leaseInfo && <tr>
                                <td colSpan={4}>
                                    <div className="card shadow mb-4">
                                        <div className="card-header py-3">
                                                <h6 className="m-0 font-weight-bold text-primary">Details</h6>
                                                <Link href='#' onClick={async e => {

                                                    const formatedData = await formateEmail(mainCtx, house);
//                                                     await mainCtx.loadForeignKeyLookup('tenantInfo');

//                                                     let last2 = '';
//                                                     for (let i = 0; i < 2; i++) {
//                                                         const inf = house.leaseInfo.monthlyInfo[i];
//                                                         if (!inf) break;
//                                                         last2 += `${inf.month}  Balance ${inf.balance}  Paid: ${inf.paid}\n`
//                                                     }
//                                                     const mailToIds = [];
//                                                     for (let i = 1; i <= 5; i++) {
//                                                         const id = house.lease['tenant' + i];
//                                                         if (id) mailToIds.push(id);
//                                                     }
//                                                     const tenantMaps = mainCtx.foreignKeyLoopkup.get('tenantInfo');
//                                                     const mailtos = mailToIds.map(id => (tenantMaps.idDesc.get(id) as any)?.email || `UnableToGetName${id}`).join(';');

//                                                     const subject = encodeURIComponent(`Payment received for ${house.address}`);
//                                                     const body = encodeURIComponent(`
// Dear tenant,
// Thank you for your payment, Below is your summary
// ${last2}`);
                                                    //                                                     const mailto = `mailto:${mailtos}?subject=${subject}&body=${body}`;
                                                    const mailto = `mailto:${formatedData.mailtos}?subject=${formatedData.subject}&body=${formatedData.body}`;
                                                    window.location.href = mailto;                                                    
                                                    e.preventDefault();
                                                }}>Email</Link>
                                        </div>
                                        <div className="card-body">
                                            <table className='table'>
                                                <tbody>
                                                    <tr><td colSpan={2}> lease.totalPayments</td><td colSpan={2}> lease.totalMissing</td></tr>
                                                    <tr><td colSpan={2}>{house.leaseInfo.totalPayments}</td><td colSpan={2}>{house.leaseInfo.totalBalance}</td></tr>
                                                    <tr><td>month</td><td>Paid</td><td>Balance</td></tr>
                                                    {
                                                        house.leaseInfo.monthlyInfo.map(info => {
                                                            return <tr><td>{info.month}</td><td>{info.paid}</td><td>{info.balance}</td></tr>
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            }
                        </>
                    })               
                }
            </tbody>
        </table>
    </div>

}



async function gatherLeaseInfomation(house: HouseWithLease, date?: Date) {
    const finder = await getLeaseUtilForHouse(house.houseID);
    const lease = await finder.findLeaseForDate(date || new Date());

    if (!lease) {        
        return 'Lease not found';
    }    
    const payments = await finder.loadLeasePayments(lease);
    const leaseBalance = finder.calculateLeaseBalances(lease, payments, 3, new Date());

    leaseBalance.monthlyInfo.reverse();
    house.lease = lease;
    house.leaseInfo = leaseBalance;
    return {
        lease,
        leaseBalance,
    };
}