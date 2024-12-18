import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

export function RentpaymentInfo(props) {   
    return <GenList {...props} table={'rentPaymentInfo'} title={'Payments List'}
        displayFields={[
            { field: 'receivedDate', 'desc': 'ReceivedDate' },
            { field: 'receivedAmount', 'desc': 'Amount' },
            { field: 'address', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type' },
            { field: 'notes', 'desc': 'Notes' },
        ]}
    /> 
}
