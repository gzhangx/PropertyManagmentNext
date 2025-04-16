import React, {useEffect, useState} from 'react';
import { IHouseInfo, ILeaseInfo, ITenantInfo } from '../../components/reportTypes';
import { getLeases} from '../../components/api'
import { getLeaseUtilForHouse, ILeaseInfoWithPmtInfo } from '../../components/utils/leaseUtil';
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
import { EditTextDropdown } from '../../components/generic/EditTextDropdown';
import moment from 'moment';
import { formatAccounting } from '../../components/utils/reportUtils';
import { IEditTextDropdownItem } from '../../components/generic/GenericDropdown';
import { orderBy } from 'lodash';
import { getTenantsForHouse, HouseWithLease } from '../../components/utils/leaseEmailUtil';


const LeaseContractDateTypesAry = ['onetimeRentAmount', 'newRentAmount', 'oneTimeRentAdjustment', ''] as const;
type LeaseContractDateTypes = typeof LeaseContractDateTypesAry[number];
type LeaseContractDate = {
    type: LeaseContractDateTypes;
    date: string;
    amount: number;
}

type ContractDates = LeaseContractDate[];


function getContractTypeSel() {
    return [
        {
            label: '',
            value: '',
        },
        {
            label: 'One Time Rent',
            value: 'onetimeRentAmount',
        },
        {
            label: 'New Rent Amount',
            value: 'newRentAmount',
        },
        {
            label: 'Rent Adjustment',
            value: 'oneTimeRentAdjustment',
        },
    ]
}


interface HouseWithTenants extends HouseWithLease {
    tenants: ITenantInfo[];
}
//old, moved toautoAssignLeases
export function LeaseReport() {    
    const mainCtx = usePageRelatedContext();
    
    
    type ILeaseInfoWithPmtInfoWithHouseId = ILeaseInfoWithPmtInfo & ILeaseInfo;
    const [leases, setLeases] = useState<ILeaseInfoWithPmtInfoWithHouseId[]>([]);

    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});

    const [contractDatesExpanded, setContractDatesExpanded] = useState<{ [key: string]: boolean }>({});

    const [isAddNew, setIsAddNew] = useState(false);
    const [newItem, setNewItem] = useState<LeaseContractDate & { strAmount: string; }>({
        type: '',
        date: '',
        amount: 0,
        strAmount: '',
    });

    const [curOwner, setCurOwner] = useState<IEditTextDropdownItem>({
            label: 'All',
            value: ''
        });
    const [allOwners, setAllOwners] = useState<{ label: string; value: string; }[]>([]);
    
    const [allHouses, setAllHouses] = useState<HouseWithTenants[]>([]);
    const monthlyDueDate = 5;
    useEffect(() => {        
        mainCtx.loadForeignKeyLookup('houseInfo').then(async () => {
            await mainCtx.loadForeignKeyLookup('tenantInfo');

            const leases = await getLeases().then(async lss => {
                //const all: ILeaseInfoWithPmtInfoWithHouseId[] = [];
                // for (const ls of orderBy(lss, ls=>ls.startDate, 'desc')) {
                //     const lt = await getLeaseUtilForHouse(ls.houseID);   
                //     const pmts = await lt.loadLeasePayments(ls);
                //     const r: ILeaseInfoWithPmtInfo = lt.calculateLeaseBalances(ls, pmts, monthlyDueDate, new Date());
                //     all.push({                    
                //         ...r,
                //         ...ls,
                //     });
                // }
                //setLeases(all);            
                setLeases(lss.map(lss => {
                    return {
                        ...lss,
                        monthlyInfo: [],
                        payments: [],
                        totalBalance: 0,
                        totalPayments: 0,
                        lastPaymentAmount: 0,
                        lastPaymentDate: '',
                    }
                }));
                return lss;
            });            

            const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
            const ownerDc = allHouses.reduce((acc, house) => {
                const ownerName = house.ownerName;
                if (!acc.dict[ownerName]) {
                    acc.owners.push(ownerName);
                    acc.dict[ownerName] = true;
                }
                return acc;
            }, {
                dict: {} as { [owner: string]: boolean; },
                owners: [] as string[],
            });

            const ht: HouseWithTenants[] = allHouses.map(h => ({ ...h, tenants:[] } as HouseWithTenants));;
            for (const h of ht) {
                const allLeases = orderBy(leases.filter(l => l.houseID === h.houseID), l => l.endDate, 'desc');
                const lastLease = allLeases[0];
                if (lastLease) {
                    h.lease = lastLease;
                    await getTenantsForHouse(mainCtx, h).then(tenants => {
                        h.tenants = tenants;
                    });
                }
            }
            setAllHouses(ht);

            ownerDc.owners.sort((a, b) => a.localeCompare(b));
            setAllOwners([
                { label: 'All', value: '' },
            ].concat(ownerDc.owners.map(o => ({
                label: o,
                value: o,
            }))));
        });

    }, []);
    
    const leaseFields = [
        {
            field: 'houseID',
            desc: 'House'
        },
        {
            field: 'contractDates',
            desc: 'ContractDates'
        },
        {
            field: 'startDate',
            desc: 'Start Date'
        },
        {
            field: 'endDate',
            desc: 'End Date'
        },
        {
            field: 'monthlyRent',
            desc: 'Amount'
        },
    ]

    function updateLease(lease: ILeaseInfoWithPmtInfoWithHouseId) {
        setLeases(orig => {
            const newLeases = [...orig];
            const ind = newLeases.findIndex(v => v.leaseID === lease.leaseID);
            if (ind >= 0) {
                newLeases[ind] = {
                    ...lease,
                }
            }
            return newLeases;
        })
    }

    //const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    const selectedHouses = allHouses.filter(h => (h.ownerName === curOwner.value || !curOwner.value) && h.disabled !== 'Y');
    
    //const houseById = keyBy(ctx.allHouses, h => h.houseID)
    return <div>
        
        <div className="modal-body">            
            <div className='row'>
                <table className='table'>
                    <tr>
                        <td>House</td>
                        <td>Lease</td>
                        <td>Owners</td>
                    </tr>
                    {
                        selectedHouses.map((h, key) => {                                                        
                            return <tr key={key}>
                                <td>{h.address}</td>
                                <td>{moment(h.lease?.endDate).format('YYYY-MM-DD')}</td>
                                <td>{ h.tenants.map(t=>t.fullName).join(',') }</td>
                            </tr>
                        })
                    }
                </table>
            </div>
            <div className='row'>
                <table className='table'>
                    <thead>
                        <tr>
                            {
                                leaseFields.map((mon, key) => {
                                    return <th className='tdColumnHeader' key={key}>{mon.desc}</th>
                                })
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            leases.map((lease, key) => {
                                return <><tr key={key}>
                                    {
                                        leaseFields.map((lf, key) => {
                                            if (lf.field === 'houseID') {
                                                //const house = houseById[lease.houseID];
                                                const houseInfos = mainCtx.foreignKeyLoopkup.get('houseInfo');
                                                let house: IHouseInfo = null;
                                                if (houseInfos) {
                                                    house = houseInfos.idDesc.get(lease.houseID) as unknown as IHouseInfo;
                                                }
                                                let h = lease.houseID;
                                                if (house) h = house.address;
                                                return <td> <button className='btn btn-primary' onClick={async () => {
                                                    const lt = await getLeaseUtilForHouse(lease.houseID);
                                                    const pmts = await lt.loadLeasePayments(lease);
                                                    const r: ILeaseInfoWithPmtInfo = lt.calculateLeaseBalances(lease, pmts, monthlyDueDate, new Date());
                                                    updateLease({
                                                        ...lease,
                                                        ...r,
                                                    })
                                                    
                                                    setLeaseExpanded(state => {                                                                                                 
                                                        return {
                                                            ...state,
                                                            [lease.leaseID]: !state[lease.leaseID]
                                                        }
                                                    })
                                                }}>{h}</button></td>
                                            } else if (lf.field === 'contractDates') {
                                                return <td><button className='btn btn-primary' onClick={() => {
                                                    setContractDatesExpanded(state => {
                                                        return {
                                                            ...state,
                                                            [lease.leaseID]: !state[lease.leaseID]
                                                        }
                                                    });
                                                }}>E</button></td>
                                            }  else if (lf.field === 'startDate' || lf.field ==='endDate') {
                                                return < td key={key} className='tdCenter' > {
                                                    moment(lease[lf.field]).format('MM/DD/YYYY')
                                                }</td>
                                            }    
                                            else if (lf.field === 'monthlyRent') {
                                                return < td key={key} className='tdCenter' > {
                                                    formatAccounting(lease[lf.field])
                                                }</td>  
                                            }                                    
                                            return < td key={key} className='tdCenter' > {
                                                lease[lf.field]
                                            }</td>
                                        })
                                    }
                                </tr>
                                    {
                                        leaseExpanded[lease.leaseID] && <tr>
                                            <td colSpan={4}>
                                                <div className="card shadow mb-4">
                                                    <div className="card-header py-3">
                                                        <h6 className="m-0 font-weight-bold text-primary">Details</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <table className='table'>
                                                            <tbody>
                                                            <tr><td colSpan={2}> lease.totalPayments</td><td colSpan={2}> lease.totalMissing</td></tr>
                                                                <tr><td colSpan={2}>{lease.totalPayments}</td><td colSpan={2}>{lease.totalBalance}</td></tr>
                                                                <tr><td>month</td><td>Paid</td><td>Accumulated</td><td>Should Accumlated</td></tr>
                                                                {
                                                                    lease.monthlyInfo.map(info => {
                                                                        return <tr><td>{ info.month}</td><td>{ info.paid}</td><td>{ info.accumulated}</td><td>{ info.shouldAccumatled}</td></tr>
                                                                    })
                                                                }
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                    {
                                        contractDatesExpanded[lease.leaseID] && <tr>
                                            <td colSpan={4}>
                                                <div className="card shadow mb-4">
                                                    <div className="card-header py-3">
                                                        <h6 className="m-0 font-weight-bold text-primary">Details</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <button className='btn btn-primary' onClick={() => {
                                                            setIsAddNew(!isAddNew);
                                                        }}>Add new</button>
                                                        <table className='table'>
                                                            <tbody>
                                                                <tr><td>Type</td><td>Date</td><td>Amount</td></tr>
                                                                {
                                                                    ((lease.contractDates || []) as LeaseContractDate[]).map(d => {
                                                                        return <tr><td>{d.type}</td><td>{d.date}</td><td>{ d.amount}</td><td>Edit</td><td>Delete</td></tr>
                                                                    })
                                                                }
                                                                {
                                                                    isAddNew && <tr>
                                                                        <td><EditTextDropdown items={getContractTypeSel()} onSelectionChanged={e => {
                                                                            setNewItem({
                                                                                ...newItem,
                                                                                type: e.value,
                                                                            })
                                                                        }}></EditTextDropdown></td>
                                                                        <td><input value={newItem.date} onChange={e => {
                                                                            setNewItem({
                                                                                ...newItem,
                                                                                date: e.target.value,
                                                                            })
                                                                        }}></input></td>
                                                                        <td><input value={newItem.amount} onChange={e => {
                                                                            setNewItem({
                                                                                ...newItem,
                                                                                strAmount: e.target.value,
                                                                                amount: parseFloat(e.target.value)
                                                                            })
                                                                        }}></input></td>
                                                                        <td>Submit</td>
                                                                        <td><button className='btn btn-primary' onClick={() => {
                                                                            setIsAddNew(false);
                                                                        }}>Cancel</button></td>
                                                                    </tr>
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
        </div>
    </div>
}