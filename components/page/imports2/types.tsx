
import { IOwnerInfo, IHouseInfo, IPayment, ITenantInfo } from '../../reportTypes';
import moment from 'moment';

export type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'houseID' | 'paymentTypeID' | 'paymentProcessor' | 'notes'
    | 'startDate' | 'endDate' | 'monthlyRent' | 'deposit' | 'petDeposit' | 'otherDeposit' | 'comment' | 'tenant1' | 'tenant2' | 'tenant3' | 'tenant4'
    | 'firstName' | 'lastName' | 'fullName' | 'phone' | 'email' | 'date';

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
    createEntity: (data: IDbSaveData) => Promise<void>;
}
export interface IPageInfo {
    pageName: 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'MaintainessRecord';
    range: string;

    fieldMap: ALLFieldNames[];
    displayColumnInfo: IDisplayColumnInfo[];

    dbLoader?: (selOwners:IOwnerInfo[]) => Promise<IDbSaveData[]>; 
    idField?: ALLFieldNames;

    rowComparers?: IRowComparer[];
    dbInserter?: IDbInserter;
    displayItem?: (params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames) => JSX.Element;
    cmpSortField?: ALLFieldNames; //used to show sheet/db rows and sort by, usually date
    reloadEntity?: (prms: IPageParms) => void;
}


export interface IStringDict {
    [key: string]: string | number; //key is of ALLFieldNames
}

export type ROWDataType = 'DB' | 'Sheet';

export interface ISheetRowData {
    importSheetData: IStringDict;    
    saveData: IDbSaveData;
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
    dataRows: ICompRowData[];
    colNames: IStringDict;
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
    getRowKey: (data: IDbSaveData) => string;
}

export function YYYYMMDDFormater(date: string) : string {
    return moment(date).format('YYYY-MM-DD');
}