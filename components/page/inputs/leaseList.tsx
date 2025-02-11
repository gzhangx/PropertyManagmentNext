import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

export function LeaseList() {
    return <GenList table={'leaseInfo'} title={'Lease List'}
        displayFields={[
            { field: 'houseID', desc: 'House' },
            { field: 'startDate', desc: 'Start'},
            { field: 'endDate', desc: 'End' },
            { field: 'monthlyRent', desc: 'Rent', },
            { field: 'tenant1', desc: 'Tenant1' },
            { field: 'tenant2', desc: 'Tenant2' },
            { field: 'tenant3', desc: 'Tenant3' },
            
        ]}
    /> 
}
