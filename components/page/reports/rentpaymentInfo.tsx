import React from 'react';
import moment from 'moment';
import {GenList} from '../../uidatahelpers/GenList';
import { IColumnInfo } from '../../uidatahelpers/GenCrudAdd';

export function RentpaymentInfo(props) {   
    return <GenList {...props} table={'rentPaymentInfo'} title={'Payments List'}
        displayFields={[
            { field: 'receivedDate', 'desc': 'ReceivedDate' },
            { field: 'receivedAmount', 'desc': 'Amount' },
            { field: 'address', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type' },
            { field: 'notes', 'desc': 'Notes' },
        ]}
        dbFieldToColumnInfo={
            (dbFields) => {
                return dbFields.map((f:IColumnInfo) => {
                    if (f.field === 'receivedDate') {
                        f.defaultNewValue = ()=>moment().format('YYYY-MM-DD');
                    }
                    return f;
                })
            }
        }
    /> 
}
