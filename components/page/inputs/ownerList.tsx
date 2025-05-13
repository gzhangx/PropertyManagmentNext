import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

//No longer used, override by page defs.
export function OwnerList(props) {   
    return <GenList {...props} table={'ownerInfo'} title={'Owner List'}
        displayFields={[
            //{ field: 'userID', desc: 'Owner', foreignKey: { table: 'userInfo', field: 'userID' }, required: true, isId: true, },
            { field: 'ownerName', desc: 'Owner Name', required: true, },
            { field: 'taxName', desc: 'Tax Name' },
            { field: 'taxID', desc: 'TAX ID', },
            { field: 'address', desc: 'Address' },
            { field: 'city', desc: 'City' },
            { field: 'state', desc: 'State' },
            { field: 'zip', desc: 'Zip' },
            { field: 'email', desc: 'Email', },
            { field: 'phone', desc: 'Phone', },
        ]}
    /> 
}
