import { TableNames } from "../../types";
import { ITableAndSheetMappingInfo } from "../datahelperTypes";

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
        ],
    },
    editTitle:'Add/Edit Lease Record',
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
import { customHeaderFilterFuncWithHouseIDLookup, genericCustomerHeaderFilterFuncForString, genericCustomHeaderFilterFunc } from "./util";

export const paymentInfoDefinition = paymentInfoDef;

export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef,
    leaseInfoDef,
    ownerInfoDef,
].reduce((acc, pp) => {
    acc.set(pp.table, pp);
    return acc;
}, new Map<TableNames, ITableAndSheetMappingInfo<unknown>>());