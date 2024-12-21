import React from 'react';
import moment from 'moment';
import {GenList} from '../../uidatahelpers/GenList';
import { IColumnInfo } from '../../uidatahelpers/GenCrudAdd';

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
            formatter: (name: string) => {
                if (name === 'receivedDate') return (v: string) => moment(v).format('YYYY-MM-DD');
                if (name === 'receivedAmount') return (v: string) => parseFloat(v || '0').toFixed(2);
                return (v: string) => v;
            },
            endCol: 'B',
        }}
    /> 
}
