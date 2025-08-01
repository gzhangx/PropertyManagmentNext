import { ITableAndSheetMappingInfo } from "../datahelperTypes";

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
}