import { TableNames } from "../../types";
import { ITableAndSheetMappingInfo } from "../datahelperTypes";


export const workerInfoDef: ITableAndSheetMappingInfo = {
    table: 'workerInfo',
    sheetMapping: {
        sheetName: 'Workers Info',
        range: 'A1:K',
        mapping: [
            'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip',
            '', //contact
            'email',
            'phone',
        ]
    }
}

export const paymentInfoDef: ITableAndSheetMappingInfo = {
    table: 'rentPaymentInfo',
    sheetMapping: {
        sheetName: 'PaymentRecord',
        range: 'A1:F',
        mapping: [
            'receivedDate',
            'receivedAmount',
            'houseID',
            'paymentTypeName',
            'notes',
            'paymentProcessor',
            //'paidBy',        
            //'created',
            //'modified',                
            //'month',                
            //'ownerID',
        ],
    }
};

export const houseInfoDef: ITableAndSheetMappingInfo = {    
    table: 'houseInfo',
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
    }
}

export const tenantInfoDef: ITableAndSheetMappingInfo = {
    table: 'tenantInfo',
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
    }
}

export const maintenanceInfoDef: ITableAndSheetMappingInfo = {
    table: 'maintenanceRecords',
    sheetMapping: {
        sheetName: 'MaintainessRecord',
        range: 'A1:G',
        mapping: [
            'date',
            'description',
            'amount',
            'houseID', //rename to prevent default handling
            'expenseCategoryId',
            'workerID',
            'comment'
        ],
    }
}


export const leaseInfoDef: ITableAndSheetMappingInfo = {
    table: 'leaseInfo',
    sheetMapping: {
        sheetName: 'Lease Info',
        range: 'A1:M',
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
}


const ownerInfoDef: ITableAndSheetMappingInfo = {
    table: 'ownerInfo'
}


export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef,
    leaseInfoDef,
    ownerInfoDef,
].reduce((acc, pp) => {
    acc.set(pp.table, pp);
    return acc;
}, new Map<TableNames, ITableAndSheetMappingInfo>());