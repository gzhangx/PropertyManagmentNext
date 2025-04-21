
import { IEditTextDropdownItem } from "../generic/GenericDropdown";
import { IPageRelatedState } from "../reportTypes";
import { FieldValueType, IDBFieldDef, TableNames } from "../types";

export type PageNames = 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'MaintainessRecord' | 'Workers Info';
export type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'amount' | 'houseID' | 'paymentTypeName' | 'paymentProcessor' | 'notes'
    | 'startDate' | 'endDate' | 'monthlyRent' | 'deposit' | 'petDeposit' | 'otherDeposit' | 'comment' | 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4' | 'tenant5'
    | 'firstName' | 'lastName' | 'fullName' | 'phone' | 'email' | 'date' | 'tenantID'
    | 'paymentID'
    | 'leaseID'
    | 'maintenanceImportAddress' //special processing fields
    | 'expenseCategoryId' | 'description' | 'workerID' | 'maintenanceID'
    | 'workerName' | 'taxName' | 'taxID' | 'state'
    | 'reasonOfTermination' | 'terminationDate' | 'terminationComments'
    | 'id'
    ;


export type DataToDbSheetMapping ={
    sheetName: PageNames;
    range: string;
    mapping: ALLFieldNames[];
    //endCol: string;
}


export interface ILeaseToTenantCustOptions {
    [fromEditItemField: string]: {  //ie. if lease Changes, table will be tenantInfo to match tenants
        options: IEditTextDropdownItem[];
    };
};
    
export interface ITableAndSheetMappingInfo {
    table: TableNames;
    allFields?: IDBFieldDef[];  //TODO: check who is using this
    displayFields?: IDBFieldDef[];
    sheetMapping?: DataToDbSheetMapping;  //how googleSheet maps to db, used to save data to sheet


    initialPageSize?: number; //default page size for the list
    title?: string;
    sortFields?: string[];

    customDisplayFunc?: (value: any, fieldDef: IDBFieldDef) => React.JSX.Element; //function to display data in the list, if not provided, default is to use the field name
    customAddNewDefaults?: (mainCtx: IPageRelatedState, columnInfo: IDBFieldDef[], editItem: ItemTypeDict) => Promise<void>;  //edit item is actuall ItemType
    customEditItemOnChange?: (mainCtx: IPageRelatedState, fieldName: string, setCustomFieldMapping: React.Dispatch<React.SetStateAction<ILeaseToTenantCustOptions>>, editItem: ItemTypeDict) => Promise<void>;  //edit item is actuall ItemType
}

export type ItemTypeDict = { [p in ALLFieldNames]?: FieldValueType; };