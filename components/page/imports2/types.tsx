
import { IOwnerInfo, IHouseInfo, IPayment, ITenantInfo } from '../../reportTypes';

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

export interface IPageDefPrms extends IBasicImportParams {
    //dispatchCurPageState: React.Dispatch<React.SetStateAction<IPageStates>>;
    //showProgress: (str: string) => void; //progressDlg.setDialogText('processing');
    //createHouse: (state: IPageStates, data: { [key: string]: IItemData }) => void;  //setDlgContent(createHouseFunc(state, all))
    //createOwner: () => void; //setDlgContent(createOwnerFunc(item.val))
    //hideDlg: () => void; //setDlgContent(null);
    refreshOwners: () => Promise<void>;
    refreshTenants: () => Promise<void>;
    setDlgContent: React.Dispatch<React.SetStateAction<JSX.Element>>;
    //setErrorStr: (str: string) => void;
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
export interface IPageInfo {
    pageName: 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'MaintainessRecord';
    range: string;

    fieldMap: ALLFieldNames[];
    displayColumnInfo: IDisplayColumnInfo[];

    dbLoader?: (selOwners:IOwnerInfo[]) => Promise<IDbSaveData[]>; 
    idField?: ALLFieldNames;
}


export interface IStringDict {
    [key: string]: string; //key is of ALLFieldNames
}



export interface ICompRowData {
    importSheetData: IStringDict;
    dbItemData?: IDbSaveData;
    saveData: IDbSaveData;
    disabled: boolean;
    invalid: string;
    matchRes: 'matched' | 'diff' | 'nomatch' | 'NA';
}

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


export interface IBasicImportParams {
    pageState: IPageStates;
    dispatchCurPageState: React.Dispatch<React.SetStateAction<IPageStates>>;
    showProgress: (str: string) => void; //progressDlg.setDialogText('processing');    
    
    setErrorStr: (str: string) => void;

    //setDlgContent: React.Dispatch<React.SetStateAction<JSX.Element>>;
    //refreshOwners: () => Promise<void>;
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
    init: (pageState: IPageStates, dbData: IDbSaveData[]) => IRowComparer;
    compareRow: (importSheetData: IStringDict, dbItemData?: IDbSaveData) => boolean;
}