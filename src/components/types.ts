import React from "react";
import { ALLFieldNames, ItemTypeDict } from "./uidatahelpers/datahelperTypes";

//export type TYPEDBTables = 'ownerInfo' | 'rentPaymentInfo' | 'houseInfo';

export type TableNames = 'rentPaymentInfo' | 'houseInfo' | 'maintenanceRecords' | 'ownerInfo' | 'leaseInfo' | 'tenantInfo' | 'workerComp' | 'userInfo'
    | 'googleApiCreds' | 'workerInfo' | 'userOptions'
    | 'expenseCategories'
    | 'paymentType'
    | 'InMemIRSExpenseCategories'  //in memory fake table for expensive category mapping
    ;
export interface ISqlDeleteResponse {
    affectedRows: number;
}
export type SortOps = '' | 'asc' | 'desc';
export interface ISqlOrderDef {
    name: string;
    op: SortOps;
    shortDesc: string;
}

export type SQLOPS = '>' | '>=' | '=' | '<' | '<=' | '!=' | '<>' | 'in' | 'isNULL' | 'like';
//copied from sql.ts
export interface ISqlRequestFieldDef {
    field: string;
    op: string;
    name: string;
}

export interface ISqlRequestWhereItem {
    field: string;
    op: SQLOPS;
    val: string | number | (string | number)[] | null;
}


export interface IPageFilter {
    id: string;
    table: string;
    field: string;
    op: SQLOPS;
    val: string | null | undefined;

    valDescUIOnly: string | null | undefined;
};

export interface IFullTextSearchPart {
    id: string;
    val: string;
    op: '>' | '<' | '=' | '';
    type: 'number' | 'date' | 'string';
    valDescUIOnly: string;
}

export interface IPageFilterSortErrors {
    sorts: ISqlOrderDef[];
    filters: IPageFilter[];
    fullTextSearchs: IFullTextSearchPart[];
    filterErrors: { [id: string]: string; };
}

export interface IPagePropsByTable {
    pagePropsTableInfo: {
        [tableName: string]: IPageFilterSortErrors;
    };
    reloadCount: number;
};

export interface IPageState {
    pageProps: IPagePropsByTable;
    setPageProps: React.Dispatch<React.SetStateAction<IPagePropsByTable>>;
}

export type TimeZoneType = 'America/New_York' | 'America/Chicago' | 'America/Denver' | 'America/Los_Angeles' | 'America/Phoenix' | 'America/Anchorage' | 'Pacific/Honolulu';

export interface ILoginResponse {
    error?: string;
    token: string;
    name: string;
    id: string;
    timezone: TimeZoneType;
}

//copied from api
export type PossibleDbTypes = (string | number | null | Date);
export interface IDBFieldDef {
    field: string; //actual field
    name?: string; //name
    desc?: string;
    type?: '' | undefined | 'int' | 'string' | 'date' | 'datetime'| 'decimal' | 'uuid';
    size?: string;
    required?: boolean;
    isId?: boolean;
    def?: string | number;
    unique?: boolean;
    ident?: boolean;
    dontUpdate?: boolean;
    userSecurityField?: boolean; //not in api, filled by model controller    
    //key?: 'UNI' | 'PRI' | null;    
    foreignKey?: {
        table: TableNames;
        field: string;
        resolvedToField?: 'addressObj';
    };
    allowBadForeignKey?: boolean;

    autoYYYYMMFromDateField?: string; //if field is automatically clculated yyyymmdd, this will be populated with the field name to get the date from


    displayType?: 'currency' | 'date'; 
    displayCustomFormatField?: (row: ItemTypeDict, field: string) => string; //format the cell to some combiation of fields.  sfield should be ALLFieldNames

    forceDefaultIfEmpty?: string|number;
}

export const DisplayCustomFormatFieldOriginalDataSufix = '_OrigData'; //save original data.

export interface IGetModelReturn {
    fields: IDBFieldDef[];
    fieldMap: {
        [key: string]: IDBFieldDef;
    };
}

export function isColumnSecurityField(field: IDBFieldDef) {
    return field.foreignKey && field.foreignKey.table === 'userInfo';
}

export type FieldValueType = string | number | null;


export type AllDateTypes = string | Date | moment.Moment | null;


export type IStringLogger = (s: string) => void;


export type ReactSetStateType<T> = React.Dispatch<React.SetStateAction<T>>;