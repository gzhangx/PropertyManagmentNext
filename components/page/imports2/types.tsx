
import { IOwnerInfo, IHouseInfo, IPayment, ITenantInfo } from '../../reportTypes';
import moment from 'moment';
import { ISqlDeleteResponse } from '../../types';

export type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'amount' | 'houseID' | 'paymentTypeID' | 'paymentProcessor' | 'notes'
    | 'startDate' | 'endDate' | 'monthlyRent' | 'deposit' | 'petDeposit' | 'otherDeposit' | 'comment' | 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4' | 'tenant'
    | 'firstName' | 'lastName' | 'fullName' | 'phone' | 'email' | 'date'
    | 'maintenanceImportAddress' //special processing fields
    ;

export interface IPaymentWithArg extends IPayment
{
    processed: boolean;
    matchNotes: string;
    invalid: boolean;
    invalidDesc: string;
}

export interface IColumnInfo {
    colType: 'string' | 'number' | 'houseAddress' | 'tenantName' | 'workerName' | 'dateYYYY-MM-DD';
}

export interface IColumnInfoLookup {
    [name: string]: IColumnInfo;
}

export interface IDisplayColumnInfo {
    field: ALLFieldNames;
    name: string;
}

export interface IDbSaveData {
    [key: string]: string | number | null; //key is of ALLFieldNames
}

export interface IDbInserter {
    name: string;
    createEntity: (data: IDbSaveData) => Promise<{id:string}>;
}

export type PageNames = 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'MaintainessRecord';
export interface IPageInfo {
    pageName: PageNames;
    range: string;

    fieldMap: ALLFieldNames[];
    displayColumnInfo: IDisplayColumnInfo[];

    dbLoader?: (selOwners: IOwnerInfo[]) => Promise<IDbSaveData[]>;
    extraProcessSheetData?: (pageData: ISheetRowData[], pageState: IPageStates) => Promise<ISheetRowData[]>;
    idField?: ALLFieldNames;

    rowComparers?: IRowComparer[];
    dbInserter?: IDbInserter;
    deleteById?: (id: string) => Promise<ISqlDeleteResponse>;
    shouldShowCreateButton?: (colInfo: IDisplayColumnInfo) => boolean;
    displayItem?: (params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames) => JSX.Element;
    displayDbExtra?: (params: IPageParms, state: IPageStates, dbMatch: IDbRowMatchData, field: ALLFieldNames) => JSX.Element | number| string;
    cmpSortField?: ALLFieldNames; //used to show sheet/db rows and sort by, usually date
    reloadEntity?: (prms: IPageParms) => void;
}


export interface IStringDict {
    [key: string]: string | number; //key is of ALLFieldNames
}

export type ROWDataType = 'DB' | 'Sheet';

export interface ISheetRowData {
    importSheetData: IStringDict;    
    //saveData: IDbSaveData;
    needUpdate: boolean;
    invalid: string;
    dataType: ROWDataType;
    matchToKey: string;
    matched: IDbSaveData;
    matcherName: string;
    displayData: IStringDict;    
}

export interface IDbRowMatchData {
    dbItemData: IDbSaveData;
    dataType: ROWDataType;
    matchedToKey: string;
    displayData: IStringDict;
}

export type ICompRowData = ISheetRowData | IDbRowMatchData;

export interface IPageDataDetails {
    dataRows: ISheetRowData[];
    colNames: IStringDict;
    dbMatchData?: IDbRowMatchData[];
    customData?: any; //used by lease to track tenant address etc
}

export interface IPageStates {
    curPage: IPageInfo;
    pageDetails: IPageDataDetails;
    sheetId: string; //not in state, passed around
    selectedOwners: IOwnerInfo[]; //not in state, passed around

    existingOwnersByName: { [ownerName: string]: IOwnerInfo };
    existingOwnersById: { [ownerId: number]: IOwnerInfo };
    missingOwnersByName: { [ownerName: string]: boolean };
    housesByAddress: { [ownerName: string]: IHouseInfo };
    houses: IHouseInfo[];
    payments: IPaymentWithArg[];
    tenants: ITenantInfo[];
    tenantByName: { [fname: string]: ITenantInfo };
    //paymentsByDateEct: { [key: string]: IPaymentWithArg[] };
    stateReloaded: number;

    reloadPayments: boolean;
}    



export function getHouseByAddress(state: IPageStates, addr:string) {
    return state.housesByAddress[addr.toLowerCase().trim()]
}

export interface IPageParms {
    dispatchCurPageState: React.Dispatch<(state: IPageStates) => IPageStates>;
    refreshOwners: () => Promise<void>;
    refreshTenants: () => Promise<void>;
    setDlgContent: React.Dispatch<React.SetStateAction<JSX.Element>>;
    setErrorStr: (text: string) => void;
    showProgress: (msg: any) => void;
}

export interface IRowComparer {
    name: string;
    getRowKey: (data: IDbSaveData, source:'DB'|'Sheet') => string;
    checkRowValid?: (data: IDbSaveData) => string | null;
}

export function YYYYMMDDFormater(date: string) : string {
    return moment(date).format('YYYY-MM-DD');
}