import { TableNames } from "../../types";
import { ALLFieldNames, ITableAndSheetMappingInfo } from "../datahelperTypes";

export const workerInfoDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'workerInfo',
    title: 'Contractors/Workers List',
    sheetMapping: {
        sheetName: 'Workers Info',
        range: 'A1:K',
        mapping: [
            'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip', 'contactPerson', 'website', 'zellerId', 'venmoId', 'paypalId', 'comment', 
            '', //contact
            'email',
            'phone',
        ]
    },
    editTitle:'Add/Edit Contrator/Worker Record',
    displayFields:[    
        {
            field: 'workerName',
            desc: 'Worker Name',
        },
        {
            field: 'taxName',
            desc: 'Tax Name',
        },
        {
            field: 'taxID',
            desc: 'Tax ID',
        },
        {
            field: 'contactPerson',
            desc: 'Contract Person'
        },
        {
            field: 'email',
            desc: 'Email'
        },
        {
            field: 'phone',
            desc: 'Phone'
        },
        {
            field: 'address',
            desc: 'Address'
        },
        {
            field: 'city',
            desc: 'City'
        },
        {
            field: 'zip',
            desc: 'Zip'
        },
        
    
        {
            field: 'website',
            desc: 'Website'
        },
        {
            field: 'zellerId',
            desc: 'Zeller ID'
        },
        {
            field: 'venmoId',
            desc: 'Venmo ID'
        },
    ],
       
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return genericCustomerHeaderFilterFuncForString(pageState, colInfo, 'houseInfo');
    },
}



export const houseInfoDef: ITableAndSheetMappingInfo<unknown> = {    
    table: 'houseInfo',
    title: 'Houses List',
    sheetMapping: {
        sheetName: 'House Info',
        range: 'A1:I',
        mapping: [
            'houseID', 'address', 'city', 'zip',
            '', //type
            '', //beds
            '', //rooms
            '', //sqrt
            'ownerName'
        ],
    },
    editTitle:'Add/Edit House information',
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return genericCustomerHeaderFilterFuncForString(pageState, colInfo, 'houseInfo');
    },
    displayFields:[
       // {field:'houseID', desc:'Address',},
        {field:'address', desc:'Address',},
        {field:'city', desc:'city',},
        {field:'zip', desc:'zip',},
    ]
}

export const tenantInfoDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'tenantInfo',
    title: 'Tenants List',
    sheetMapping: {
        sheetName: 'Tenants Info',
        range: 'A1:G',
        mapping: [
            'tenantID',
            'firstName',
            'lastName',
            'fullName',
            'phone',
            'email',
            'comment',
        ],
    },
    editTitle:'Add/Edit Tenant Record',
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return genericCustomerHeaderFilterFuncForString(pageState, colInfo, 'tenantInfo');
    },
}

export const maintenanceInfoDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'maintenanceRecords',
    sheetMapping: {
        sheetName: 'MaintainessRecord',
        range: 'A1:G',
        mapping: [
            'maintenanceID',
            'date',
            'description',
            'amount',
            'houseID', //rename to prevent default handling
            'expenseCategoryId',
            'workerID',
            'comment'
        ],
    },
editTitle:'Add/Edit Maintenance Record',
    displayFields: [
        { field: 'date', 'desc': 'Date', type: 'date', displayType: 'date' },
        { field: 'description', 'desc': 'Description', type: 'string' },
        { field: 'amount', 'desc': 'Amount', type: 'decimal', displayType: 'currency' },
        { field: 'houseID', 'desc': 'House' },
        { field: 'expenseCategoryId', 'desc': 'Category', type: 'string' },
        { field: 'workerID', 'desc': 'Workers/Contractors' },
        { field: 'comment', 'desc': 'Comment', type: 'string' },
    ],
    sortFields: ['date', 'houseID'],
    title: 'Maintenance Records',
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return customHeaderFilterFuncWithHouseIDLookup(mainCtx, pageState, colInfo, 'maintenanceRecords');
        },

}


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
            console.log('debugremove lease', c.field, editItem.data[c.field as ALLFieldNames])
        }
    },
}


const ownerInfoDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'ownerInfo',
    displayFields:[
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
    ]
}

import { paymentInfoDef } from './rentpaymentInfoDef'

const expenseCategoryDef: ITableAndSheetMappingInfo<unknown> = {
    table: 'expenseCategories',
    displayFields: [
        //{ field: 'userID', desc: 'Owner', foreignKey: { table: 'userInfo', field: 'userID' }, required: true, isId: true, },
        { field: 'expenseCategoryID', desc: 'ExpensiveCategoryID', required: true, },
        { field: 'expenseCategoryName', desc: 'Name' },
        { field: 'mappedToTaxExpenseCategoryName', desc: 'Map to IRS Type', },        
        { field: 'doNotIncludeInTax', desc:'Dont include in expense tax'}
    ]
}

import { customHeaderFilterFuncWithHouseIDLookup, genericCustomerHeaderFilterFuncForString, genericCustomHeaderFilterFunc } from "./util";

export const paymentInfoDefinition = paymentInfoDef;

export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef,
    leaseInfoDef,
    ownerInfoDef,
    expenseCategoryDef,
].reduce((acc, pp) => {
    acc.set(pp.table, pp as any);
    return acc;
}, new Map<TableNames, ITableAndSheetMappingInfo<unknown>>());