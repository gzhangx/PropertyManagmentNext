import React, {useEffect, useState} from 'react';
import { IHouseInfo, IPayment, ITenantInfo } from '../../components/reportTypes';
import { getLeases} from '../../components/api'
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
import { EditTextDropdown } from '../../components/generic/EditTextDropdown';
import moment from 'moment';
import { IEditTextDropdownItem } from '../../components/generic/GenericDropdown';
import { orderBy } from 'lodash';
import { getTenantsForHouse } from '../../components/utils/leaseEmailUtil';
import { gatherLeaseInfomation, getAllPaymentForHouse, HouseWithLease, ILeaseInfoWithPmtInfo } from '../../components/utils/leaseUtil';


interface HouseWithTenants extends HouseWithLease {
    tenants: ITenantInfo[];
    leaseBal?: ILeaseInfoWithPmtInfo;
    payments?: IPayment[];
}
//old, moved toautoAssignLeases
export function LeaseReport() {    
    const mainCtx = usePageRelatedContext();
    
    const [curOwner, setCurOwner] = useState<IEditTextDropdownItem>({
            label: 'All',
            value: ''
        });
    const [allOwners, setAllOwners] = useState<{ label: string; value: string; }[]>([]);
    
    const [allHouses, setAllHouses] = useState<HouseWithTenants[]>([]);

    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});
    useEffect(() => {        
        mainCtx.showLoadingDlg('Loading house info...');
        mainCtx.loadForeignKeyLookup('houseInfo').then(async () => {
            mainCtx.showLoadingDlg('Loading tenant info...');
            await mainCtx.loadForeignKeyLookup('tenantInfo');

            mainCtx.showLoadingDlg('Loading leasse info...');
            const leases = await getLeases();
            mainCtx.showLoadingDlg('');

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

            for (const h of ht) {
                console.log('gatherLeaseInfomation', h.address);
                const hlInfo = await gatherLeaseInfomation(h);
                const payments = await getAllPaymentForHouse(h.houseID);
                h.payments = payments;
                if (hlInfo !== 'Lease not found') {
                    console.log('gatherLeaseInfomation done', h.address);
                    h.leaseBal = hlInfo.leaseBalance;                    
                }

                if (h.payments) {
                    h.payments = orderBy(h.payments, p=>p.receivedDate, 'desc');
                }
                if (h.leaseBal || h.payments) {
                    setAllHouses([...ht]);
                }
                
            }
        });

    }, []);
    

    //const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    const selectedHouses = allHouses.filter(h => (h.ownerName === curOwner.value || !curOwner.value) && h.disabled !== 'Y');
    
    //const houseById = keyBy(ctx.allHouses, h => h.houseID)
    return <div>
        <div>Lease reportt</div>
        <div className="row">                    
                    <div className="col-sm-3">
                        <EditTextDropdown items={allOwners.map(o => ({
                            ...o,
                            selected: o.value === curOwner.value
                        }))} onSelectionChanged={sel => {
                            //selected={state.curSelectedOwner} 
                            setCurOwner(sel);
                            }} curDisplayValue={curOwner.label}
                            opts={{ placeHolder: 'Select Owner' }}
                        ></EditTextDropdown></div>                            
                </div>
        <div className="modal-body">            
            <div className='row'>
                <table className='table'>
                    <thead>
                        
                    <tr>
                        <th>House</th>
                            <th>Lease Term</th>
                            <th className='accounting-alright'>Balance</th>
                            <th className='accounting-alright'>lastPaymentAmount</th>
                            <th className='accounting-alright'>Last Payment Date</th>
                        <th>Owners</th>
                    </tr>
                    </thead>
                    {
                        selectedHouses.map((h, key) => {                                                        
                            let totalBalance = '';
                            let lastPaymentAmount = '';
                            let lastPaymentDate = '';
                            if (h.leaseBal) {
                                totalBalance = h.leaseBal.totalBalance.toFixed(2);
                                lastPaymentAmount = h.leaseBal.lastPaymentAmount.toFixed(2);
                                lastPaymentDate = moment(h.leaseBal.lastPaymentDate).format('MM/DD/YYYY');
                                if (!moment(h.leaseBal.lastPaymentDate).isValid()) {
                                    lastPaymentDate = h.leaseBal.lastPaymentDate;
                                }
                            }

                            return <><tr key={key}>
                                <td className='td-center' onClick={async () => {
                                    setLeaseExpanded({ ...leaseExpanded, [h.houseID]: !leaseExpanded[h.houseID] });
                                    const hlInfo = await gatherLeaseInfomation(h);
                                    console.log('debugremove hlinfo', hlInfo);
                                }}>{h.address}  { leaseExpanded[h.houseID]?'Y':'N'}</td>
                                <td className='td-center'>{moment(h.lease?.startDate).format('MM/DD/YYYY') +
                                    ' --- ' + moment(h.lease?.endDate).format('MM/DD/YYYY')}</td>
                                <td className='accounting-alright'>{totalBalance}</td>
                                <td className='accounting-alright'>{lastPaymentAmount}</td>
                                <td className='accounting-alright'>{lastPaymentDate}</td>
                                <td >{ h.tenants.map(t=>`${t.fullName} ${t.phone}   ${t.email}` ).map(t=>{
                                    return <>{t}<br></br></>;
                                    }) } </td>
                            </tr>
                                {
                                    leaseExpanded[h.houseID] && h.leaseInfo && <tr>
                                        <td colSpan={4}>
                                            <div className="card shadow mb-4">
                                                <div className="card-header py-3">
                                                    <h6 className="m-0 font-weight-bold text-primary">Details</h6>                                                                                                        
                                                </div>
                                                <div className="card-body">
                                                    <table className='table'>
                                                        <tbody>
                                                            <tr><td colSpan={2}> lease.totalPayments</td><td colSpan={2}> lease.totalMissing</td></tr>
                                                            <tr><td colSpan={2}>{h.leaseInfo.totalPayments}</td><td colSpan={2}>{h.leaseInfo.totalBalance}</td></tr>
                                                            <tr><td>month</td><td>Paid</td><td>Balance</td></tr>
                                                            {
                                                                h.leaseInfo.monthlyInfo.map(info => {
                                                                    return <tr><td>{info.month}</td><td>{info.paid}</td><td>{info.balance}</td></tr>
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="card-header py-3">
                                                    <h6 className="m-0 font-weight-bold text-primary">Payments</h6>
                                                </div>
                                                <div className="card-body">
                                                    <table className='table'>
                                                        <tbody>                                                                                                                        
                                                            {
                                                                (h.payments || []).map(pmt => {
                                                                    return <tr><td>{pmt.receivedDate}</td><td>{pmt.receivedAmount}</td><td>{pmt.leaseID}</td></tr>
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
                </table>
            </div>
        </div>
    </div>
}