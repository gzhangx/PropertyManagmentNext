import React from 'react';
import {GenList} from '../../uidatahelpers/GenList';
import moment from 'moment';

export function RentpaymentInfo(props) {   
    return <GenList {...props} table={'rentPaymentInfo'} title={'Payments List'}
        displayFields={[
            { field: 'receivedDate', 'desc': 'ReceivedDate', type: 'date' },
            { field: 'receivedAmount', 'desc': 'Amount', type: 'number' },
            { field: 'houseID', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type' },
            { field: 'notes', 'desc': 'Notes' },
        ]}
        sortFields={
            ['receivedDate', 'houseID']
        }
        customDisplayFunc={(value, fieldDef) => {
            if (fieldDef.field === 'receivedDate') {
                let str = moment(value).format('YYYY-MM-DD HH:mm:ss');
                while (str.endsWith(':00')) {
                    str = str.substring(0, str.length - 3);
                }
                if (str.endsWith(' 00')) {
                    str = str.substring(0, str.length - 3);
                }
                return str;
            }
            return value;
        }
        }
    /> 
}
