import React from "react";

//export type TYPEDBTables = 'ownerInfo' | 'rentPaymentInfo' | 'houseInfo';

export type TableNames = 'rentPaymentInfo' | 'houseInfo' | 'maintenanceRecords' | 'ownerInfo' | 'leaseInfo' | 'tenantInfo' | 'workerComp' | 'userInfo'
    | 'googleApiCreds' | 'workerInfo' | 'userOptions';
export interface ISqlDeleteResponse {
    affectedRows: number;
}
export type SortOps = '' | 'asc' | 'desc';
export interface ISqlOrderDef {
    name: string;
    op: SortOps;
    shortDesc: string;
}

export type SQLOPS = '>' | '>=' | '=' | '<' | '<=' | '!=' | '<>' | 'in' | 'isNULL';
//copied from sql.ts
export interface ISqlRequestFieldDef {
    field: string;
    op: string;
    name: string;
}

export interface ISqlRequestWhereItem {
    field: string;
    op: SQLOPS;
    val: string | number | (string | number)[];
}


export interface IPageFilter {
    id: string;
    table: string;
    field: string;
    op: SQLOPS;
    val: string;
};

export interface IPagePropsByTable {
    pagePropsTableInfo: {
        [tableName: string]: {
            sorts: ISqlOrderDef[];
            filters: IPageFilter[];
        };
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
    def?: string;
    unique?: boolean;
    ident?: boolean;
    dontUpdate?: boolean;
    userSecurityField?: boolean; //not in api, filled by model controller    
    //key?: 'UNI' | 'PRI' | null;    
    foreignKey?: {
        table: TableNames;
        field: string;
    };
    allowBadForeignKey?: boolean;
}

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


export type AllDateTypes = string | Date | moment.Moment;


export type IStringLogger = (s: string) => void;