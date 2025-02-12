import React from 'react';
import {GenList} from '../../uidatahelpers/GenList';

export function RentpaymentInfo(props) {   
    return <GenList {...props} table={'rentPaymentInfo'} title={'Payments List'}
        displayFields={[
            { field: 'receivedDate', 'desc': 'ReceivedDate', type: 'date' },
            { field: 'receivedAmount', 'desc': 'Amount', type: 'number' },
            { field: 'houseID', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type' },
            { field: 'notes', 'desc': 'Notes' },
        ]}
    /> 
}
