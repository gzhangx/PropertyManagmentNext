import { TableNames } from "../../types";
import { IHelperProps } from "../datahelpers";

const workerInfoDef: IHelperProps = {
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

const paymentInfoDef: IHelperProps = {
    table: 'rentPaymentInfo',
    sheetMapping: {
        sheetName: 'PaymentRecord',
        range: 'A1:F',
        mapping: [
            'receivedDate',
            'receivedAmount',
            'address',
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

const houseInfoDef: IHelperProps = {    
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

const tenantInfoDef: IHelperProps = {
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

const maintenanceInfoDef: IHelperProps = {
    table: 'maintenanceRecords',
    sheetMapping: {
        sheetName: 'MaintainessRecord',
        range: 'A1:G',
        mapping: [
            'date',
            'description',
            'amount',
            'maintenanceImportAddress', //rename to prevent default handling
            'expenseCategoryId',
            'workerID',
            'comment'
        ],
    }
}

const ownerInfoDef: IHelperProps = {
    table: 'ownerInfo'
}


export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef, ownerInfoDef].reduce((acc, pp) => {
    acc.set(pp.table, pp);
    return acc;
}, new Map<TableNames, IHelperProps>());