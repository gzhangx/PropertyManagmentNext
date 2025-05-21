import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

//no longer used
export function LeaseList() {
    return <GenList table={'leaseInfo'} title={'Leases List'}
        displayFields={[
            { field: 'houseID', desc: 'House' },
            { field: 'startDate', desc: 'Start Date', displayType:'date'},
            { field: 'endDate', desc: 'End Date', displayType:'date'},
            { field: 'monthlyRent', desc: 'Rent',displayType:'currency' },
            { field: 'tenant1', desc: 'Tenant1' },
            { field: 'tenant2', desc: 'Tenant2' },
            { field: 'tenant3', desc: 'Tenant3' },
            
        ]}
    /> 
}
