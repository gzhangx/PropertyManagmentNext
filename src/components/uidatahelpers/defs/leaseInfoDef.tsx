import { ITableAndSheetMappingInfo } from "../datahelperTypes";
import moment from "moment";
export const leaseInfoDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'leaseInfo',
    sheetMapping: {
        sheetName: 'Lease Info',
        range: 'A1:Q',
        mapping: [
            'leaseID',
            'houseID',
            'startDate',
            'endDate',
            'monthlyRent',
            'deposit',
            'petDeposit',
            'otherDeposit',
            'comment',
            'reasonOfTermination',
            'terminationDate',
            'terminationComments',
            'tenant1',
            'tenant2',
            'tenant3',
            'tenant4',
            'tenant5', //not here, added to force mapping
            '',
            'rentDueDay',
        ],
    },
    otherFieldOverrideFields: {
        rentDueDay: 5,
    },
    editTitle: 'Add/Edit Lease Record',
    displayFields:
        [
            { field: 'houseID', desc: 'House' },
            { field: 'startDate', desc: 'Start Date', displayType: 'date' },
            { field: 'endDate', desc: 'End Date', displayType: 'date' },
            { field: 'monthlyRent', desc: 'Rent', displayType: 'currency' },
            { field: 'tenant1', desc: 'Tenant1' },
            { field: 'tenant2', desc: 'Tenant2' },
            { field: 'tenant3', desc: 'Tenant3' },
        ],
    customAddNewDefaults: async (mainCtx, columnInfo, editItem) => {
        for (const c of columnInfo) {
            if (c.field === 'terminationDate') {
                editItem.data[c.field] = '';
            } else if (c.field === 'endDate') {
                editItem.data[c.field] = '';
            }
            //console.log('debugremove lease', c.field, editItem.data[c.field as ALLFieldNames])
        }
    },

    customEndColAddDel: ({ add, del, row, addNew }) => {
        return (
            <>
                {add}                
                <span style={{ marginLeft: '3px' }}></span>
                <button className="btn btn-primary outline-primary" type="button" onClick={() => {
                    console.log('Renew lease', row);
                    addNew(async item => {
                        console.log('Renew lease new item', item);
                        item.data.houseID = row.data.houseID;
                        item.data.startDate = moment(row.data.endDate).add(1, 'month').startOf('month').format('YYYY-MM-DD');
                        item.data.endDate = moment(item.data.startDate).add(1, 'year').endOf('month').format('YYYY-MM-DD');
                        item.data.rentDueDay = 5;
                        item.data.monthlyRent = row.data.monthlyRent;
                        item.data.comment = `Renewed from ${moment(item.data.endDate).format('YYYY-MM-DD')}`;
                        for (const field of ['tenant1', 'tenant2', 'tenant3', 'tenant4', 'tenant5']) {
                            item.data[field as 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4' | 'tenant5'] = row.data[field as 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4' | 'tenant5'];
                        }
                    });
                }}>Renew</button>
                <span style={{marginLeft:'10px'}}></span>
                {del}
            </>
        );
    }
}