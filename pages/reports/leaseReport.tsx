import React, {useEffect, useState} from 'react';
import { IHouseInfo, ITenantInfo } from '../../components/reportTypes';
import { getLeases} from '../../components/api'
import { usePageRelatedContext } from '../../components/states/PageRelatedState';
import { EditTextDropdown } from '../../components/generic/EditTextDropdown';
import moment from 'moment';
import { IEditTextDropdownItem } from '../../components/generic/GenericDropdown';
import { orderBy } from 'lodash';
import { getTenantsForHouse, HouseWithLease } from '../../components/utils/leaseEmailUtil';


interface HouseWithTenants extends HouseWithLease {
    tenants: ITenantInfo[];
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
        });

    }, []);
    

    //const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    const selectedHouses = allHouses.filter(h => (h.ownerName === curOwner.value || !curOwner.value) && h.disabled !== 'Y');
    
    //const houseById = keyBy(ctx.allHouses, h => h.houseID)
    return <div>
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
                    <tr>
                        <td>House</td>
                        <td>Lease</td>
                        <td>Owners</td>
                    </tr>
                    {
                        selectedHouses.map((h, key) => {                                                        
                            return <tr key={key}>
                                <td>{h.address}</td>
                                <td>{moment(h.lease?.startDate).format('YYYY-MM-DD') +
                                    ' '+moment(h.lease?.endDate).format('YYYY-MM-DD')}</td>
                                <td onClick={() => {
                                    mainCtx.showLoadingDlg(`Tenant emails: ${h.tenants.map(t => t.email).join(',')}`);
                                }}>{ h.tenants.map(t=>t.fullName).join(',') }</td>
                            </tr>
                        })
                    }
                </table>
            </div>
        </div>
    </div>
}