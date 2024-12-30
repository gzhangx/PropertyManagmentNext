import { TableNames } from "../../types";
import { ITableAndSheetMappingInfo } from "../datahelperTypes";


const workerInfoDef: ITableAndSheetMappingInfo = {
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

const paymentInfoDef: ITableAndSheetMappingInfo = {
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

const houseInfoDef: ITableAndSheetMappingInfo = {    
    table: 'houseInfo',
    sheetMapping: {
        sheetName: 'House Info',
        range: 'A1:I',
        mapping: [
            '', 'address', 'city', 'zip',
            '', //type
            '', //beds
            '', //rooms
            '', //sqrt
            'ownerName'
        ],
    }
}

const tenantInfoDef: ITableAndSheetMappingInfo = {
    table: 'tenantInfo',
    sheetMapping: {
        sheetName: 'Tenants Info',
        range: 'A1:G',
        mapping: [
            '',
            'firstName',
            'lastName',
            'fullName',
            'phone',
            'email',
            'comment',
        ],
    }
}

const maintenanceInfoDef: ITableAndSheetMappingInfo = {
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

const ownerInfoDef: ITableAndSheetMappingInfo = {
    table: 'ownerInfo'
}


export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef, ownerInfoDef].reduce((acc, pp) => {
    acc.set(pp.table, pp);
    return acc;
}, new Map<TableNames, ITableAndSheetMappingInfo>());