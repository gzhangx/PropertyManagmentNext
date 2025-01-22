
import { IDBFieldDef, TableNames } from "../types";

export type PageNames = 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'MaintainessRecord' | 'Workers Info';
export type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'amount' | 'houseID' | 'paymentTypeName' | 'paymentProcessor' | 'notes'
    | 'startDate' | 'endDate' | 'monthlyRent' | 'deposit' | 'petDeposit' | 'otherDeposit' | 'comment' | 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4' | 'tenant'
    | 'firstName' | 'lastName' | 'fullName' | 'phone' | 'email' | 'date' | 'tenantID'
    | 'paymentID'
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


export interface ITableAndSheetMappingInfo {
    table: TableNames;
    allFields?: IDBFieldDef[];
    displayFields?: IDBFieldDef[];
    sheetMapping?: DataToDbSheetMapping;  //how googleSheet maps to db, used to save data to sheet
}