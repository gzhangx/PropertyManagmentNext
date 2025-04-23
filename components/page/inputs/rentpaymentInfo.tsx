import React from 'react';
import {GenList} from '../../uidatahelpers/GenList';
import moment from 'moment';
import { removeZeroHourMinuteSeconds } from '../../utils/reportUtils';

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
                return removeZeroHourMinuteSeconds(str);
            }
            return value;
        }
        }
    /> 
}
