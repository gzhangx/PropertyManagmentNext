import { AllDateTypes, FieldValueType, IDBFieldDef, IGetModelReturn, IPageState, ISqlDeleteResponse, ISqlOrderDef, ISqlRequestWhereItem, TableNames, TimeZoneType } from './types'

import { IEditTextDropdownItem } from './generic/GenericDropdown';
import { ItemType, ItemTypeDict } from './uidatahelpers/datahelperTypes';
import { NotifyIconItem } from './page/tinyIconNotify';
import { JSX } from 'react';

export interface IPayment {
    address: string;
    addressId: string;
    amount: number;
    created: string;
    date: string;
    houseID: string;
    includeInCommission: string;
    modified: string;
    month: string;
    notes: string;
    ownerID: number;
    ownerName: string;
    paidBy: string;
    paymentID: string;
    paymentProcessor: string;
    paymentTypeID: string;
    paymentTypeName: string;
    receivedAmount: number;
    receivedDate: string;
    source: string;
    leaseID?: string;
    applyPaymentAfterDate: string;
}

/*export interface IPageProps {
    reloadCount: number;
    [tableName: string]: {        
    
        sorts: [
            {
                name: string,
                op: 'asc' | 'desc',
                shortDesc: 'AS' | 'DS',
            }
        ]
    } | number;
};
*/


export interface IHouseInfo {
    houseID: string;
    ownerName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    disabled?: 'Y' | 'N' | null;
    cost?: number;
}


export interface IExpenseData {
    maintenanceID: string;
    address: string;
    amount: number;
    category: string;
    comment: string;
    date: string;
    hours: string;
    description: string;
    expenseCategoryName: string;
    expenseCategoryId: string; //this could be the name in the new realm
    houseID: string;
    workerID: string;
    workerFirstName: string;
    workerLastName: string;
    month: string;

    utcDate?: string;  //if set, that means we converted date to local
}

export interface IExpenseCategory {
    expenseCategoryID: string;
    expenseCategoryName: string;
    displayOrder: string;
}

export interface IWorkerInfoShort {
    workerID: string;
    workerName: string;
}
export interface IWorkerInfo extends IWorkerInfoShort {        
    taxName: string;
    taxID: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone: string;
}

export interface IOwnerInfo {
    ownerName: string;
    taxName: string;
    taxID: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone: string;
    smtpEmailUser: string;
    smtpEmailPass: string;
}

export interface ILeaseInfo {
    'leaseID': string;
    'deposit': number;
    'petDeposit': number;
    'otherDeposit': number;
    'endDate': string;
    'startDate': string;
    'houseID': string;
    terminationDate?: string;
    ownerID: number;
    tenant1: string;
    tenant2: string;
    tenant3: string;
    tenant4: string;
    tenant5: string;
    comment: string;
    monthlyRent: number;
    contractDates: any;

    rentDueDay: number;
    firstMonthProratedRent: number;
}

export interface ITenantInfo {
    tenantID: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    email: string;
    comment: string;
}

export interface IPaymentCalcOpts {
    isGoodMonth: (mon: string) => boolean;
    isGoodHouseId: (mon: string) => boolean;
    isGoodWorkerId: (workerID: string) => boolean;
    getHouseShareInfo: () => IHouseInfo[];
}

export interface IMaintenanceRawData {
    maintenanceID: string;
    date: string;
    month: string;
    description: string;
    amount: number; 
    houseID: string;
    expenseCategoryId: string;
    hours: string;
    workerID: string;
    comment: string;
}

export interface IMaintenanceDataResponse extends IMaintenanceRawData {
    address: string;
    workerName: string;
}

export interface IWorkerComp {
    id: string;
    workerID: string;
    dayOfMonth: string;
    type: 'percent' | 'amount';
    amount: number;
    houseID: string;
}

export interface IWorkerCompResponse extends IWorkerComp {
    //workerID: string;
    //dayOfMonth: string;
    //type: 'percent' | 'amount';
    //amount: number;
    //houseID: string;
    address: string;
    firstName: string;
    lastName: string;
}

export type IStringBoolMap = { [id: string]: boolean };

export type IModelsDict = Map<TableNames, IGetModelReturn>;
export type IModelsProps = {
    models: IModelsDict;
    getTableModel: (table: TableNames) => Promise<IDBFieldDef[]>;
    getTableModelSync: (table: TableNames) => IDBFieldDef[];
}

export interface IHelperOpts {
    whereArray?: ISqlRequestWhereItem[];
    order?: ISqlOrderDef[];
    rowCount?: number;
    offset?: number;
}


export type IForeignKeyLookupMap = Map<TableNames, IForeignKeyCombo>; //tablename -> id:desc map
export type IHelper = {
    getModelFields: () => IDBFieldDef[];
    loadModel: () => Promise<IGetModelReturn>;
    loadData: (opts?: IHelperOpts) => Promise<{
        total: number;
        rows: any[];
    }>;
    saveData: (data: ItemType, id: FieldValueType, saveToSheet: boolean, foreignKeyLookup: IForeignKeyLookupMap) => Promise<any>;
    deleteData: (ids: string[], foreignKeyLookup: IForeignKeyLookupMap, data: ItemType) => Promise<ISqlDeleteResponse>;
}

export type TableNameToHelper = Map<TableNames, IHelper>;

export type IForeignKeyParsedRow = {
    id: string;
    desc: string;
}
export type IForeignKeyIdDesc = Map<string, IForeignKeyParsedRow>;
export type IForeignKeyCombo = {
    idDesc: IForeignKeyIdDesc;
    idObj: Map<string, ItemTypeDict>;
    descToId: IForeignKeyIdDesc;
    rows: IForeignKeyParsedRow[];

    specialOptionGenerator?: (row: ItemTypeDict) => IEditTextDropdownItem[];
}


export type TopBarIconNotifyCfg = {
    show: boolean;
    setShow: React.Dispatch<React.SetStateAction<boolean>>;
    items: NotifyIconItem[];
    setTopBarItems: React.Dispatch<React.SetStateAction<NotifyIconItem[]>>;
}

interface IGoogleAuthInfo {
    private_key_id: string;
    private_key: string;
    client_email: string;
}


export type IGoogleSheetAuthInfo = {
    googleSheetId: string;
    error?: string;
} & IGoogleAuthInfo;

export interface IPageRelatedState {
    pageState: IPageState;    
    googleSheetAuthInfo: IGoogleSheetAuthInfo;
    setGoogleSheetAuthinfo: (auth: IGoogleSheetAuthInfo) => void;
    reloadGoogleSheetAuthInfo: () => Promise<IGoogleSheetAuthInfo>;
    loginError: string;
    setLoginError: (s: string) => void;
    
    modelsProp: IModelsProps;
    reloadCounter: number;

    //tableToHelperMap: TableNameToHelper;
    //setTableTohelperMap: React.Dispatch<React.SetStateAction<TableNameToHelper>>;
    foreignKeyLoopkup: IForeignKeyLookupMap;
    loadForeignKeyLookup: (t: TableNames, forceReload?: boolean) => Promise<IForeignKeyCombo>;
    checkLoadForeignKeyForTable: (table: TableNames) => Promise<IDBFieldDef[]>;
    translateForeignLeuColumn: (def: IDBFieldDef, dataDict: any) => string;
    translateForeignLeuColumnToObject: (def: IDBFieldDef, data: ItemType) => ItemType | string;
    getAllForeignKeyLookupItems: (table: TableNames) => ItemType[] | null;
    forceReload: () => void;

    topBarMessagesCfg: TopBarIconNotifyCfg;
    topBarErrorsCfg: TopBarIconNotifyCfg;


    timezone: TimeZoneType;
    browserTimeToUTCDBTime: (bt: AllDateTypes | undefined | null) => string | null;
    utcDbTimeToZonedTime: (utc: AllDateTypes | undefined, format?: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss') => string | null;
    

    showLoadingDlg: (content: string | JSX.Element | null, title?: string) => void;
    loadingDlgContent: string | JSX.Element | null;
    loadingDlgTitle: string;
}



export const TaxExpenseCategories = [
    'Advertising',
    'Auto and Travel',
    'Cleaning and Maintenance', // 'Cleaning', // ,
    'Commissions',
    'Insurance',
    'Legal and Other Profession Fees',
    'Management fees', //HOA fees
    'Mortgage interest paid to banks, etc',
    'Other interest',
    'Repairs', //Repair
    'Supplies',
    'Taxes', //Tax
    'Utilities', //Utitlities
    'Other', //Others
] as const;

export type TaxExpenseCategoryNameType = (typeof TaxExpenseCategories)[number];

//Entertainment
//Food / Drink
//Inspection / Checking
//Lawn Maintenance
//medical
//Pest Control
//Return of Deposit

export type TaxExpenseCategoryDataType = {
    expenseCategoryID: string;
    expenseCategoryName: string;
    mappedToTaxExpenseCategoryName: TaxExpenseCategoryNameType;
    doNotIncludeInTax: boolean;
    displayOrder: string;
};

