import React from 'react';
import moment from 'moment';
import {GenList} from '../../uidatahelpers/GenList';

export function RentpaymentInfo(props) {   
    return <GenList {...props} table={'rentPaymentInfo'} title={'Payments List'}
        displayFields={[
            { field: 'receivedDate', 'desc': 'ReceivedDate', defaultNewValue: () => moment().format('YYYY-MM-DD'), type: 'date' },
            { field: 'receivedAmount', 'desc': 'Amount', type: 'number' },
            { field: 'address', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type' },
            { field: 'notes', 'desc': 'Notes' },
        ]}

        sheetMapping={{
            sheetName: 'PaymentRecord',
            mapping: [
                'receivedDate',
                'receivedAmount',
                'houseID_labelDesc',
                'paymentTypeName',
                'notes',
            ],            
            //endCol: 'B',
        }}
    /> 
}
