import moment from "moment";
import { TableNames } from "../../types";
import { ITableAndSheetMappingInfo } from "../datahelperTypes";
import { ILeaseInfo, ITenantInfo } from "../../reportTypes";
import { IEditTextDropdownItem } from "../../generic/GenericDropdown";


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
        range: 'A1:G',
        mapping: [
            'paymentID',
            'receivedDate',
            'receivedAmount',
            'houseID',
            'paymentTypeName',
            'paymentProcessor',
            'notes',            
            //'paidBy',        
            //'created',
            //'modified',                
            //'month',                
            //'ownerID',
        ],
    },

    title: 'RentPaymentt Records',
    //this class is defined by components/page/inputs/rentpaymentInfo.tsx
    customDisplayFunc: (value, fieldDef) => {
        if(fieldDef.field === 'receivedDate') {
            let str = moment(value).format('YYYY-MM-DD HH:mm:ss'); 
            while (str.endsWith(':00')) {
                str = str.substring(0, str.length - 3);
            }
            return str;
        }
        return value;
    },
    customAddNewDefaults: async (mainCtx, columnInfo, editItem) => {        
        for (const c of columnInfo) {
            if (c.field === 'paymentTypeName') {
                editItem[c.field] = 'Rent';
            }
        }
    },
    customEditItemOnChange: async (mainCtx, fieldName: string, setCustomFieldMapping, editItem) => {        
        if (fieldName === 'leaseID') {
            await mainCtx.loadForeignKeyLookup('leaseInfo');
            await mainCtx.loadForeignKeyLookup('tenantInfo');
            const fkObj = mainCtx.translateForeignLeuColumnToObject({
                field: 'leaseID',
                foreignKey: {
                    table: 'leaseInfo',
                    field: 'leaseID',
                }
            }, editItem);
            console.log('fkObj', fkObj);
            if (fkObj) {
                const lease = fkObj as ILeaseInfo;
                const options: IEditTextDropdownItem[] = [];
                for (let ti = 1; ti <= 5; ti++) {
                    const tenantId = lease[`tenant${ti}`];
                    if (tenantId) {
                        const tenantTranslated = mainCtx.translateForeignLeuColumnToObject({
                            field: 'tenantID',
                            foreignKey: {
                                table: 'tenantInfo',
                                field: 'tenantID',
                            }
                        }, {
                            tenantID: tenantId,
                        }) as ITenantInfo;
                        if (tenantTranslated) {
                            console.log('tenantTranslated', tenantTranslated);
                            options.push({
                                label: tenantTranslated.fullName,
                                value: tenantTranslated.fullName,
                            })
                        }
                    }   
                }
                setCustomFieldMapping(prev => {
                    return {
                        ...prev,
                        'paidBy': {
                            options,                            
                        }
                    }
                });

            }
        }
        
    },
    displayFields:
        [
        { field: 'receivedDate', 'desc': 'ReceivedDate', type: 'date' },
        { field: 'receivedAmount', 'desc': 'Amount', type: 'decimal' },
        { field: 'houseID', 'desc': 'Address' },
        { field: 'paymentTypeName', 'desc': 'type' },
        { field: 'notes', 'desc': 'Notes' },
        ],
    sortFields:        ['receivedDate', 'houseID'],
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

    sortFields: ['date', 'houseID'],
    title: 'Maintenance Records',
}


export const leaseInfoDef: ITableAndSheetMappingInfo = {
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