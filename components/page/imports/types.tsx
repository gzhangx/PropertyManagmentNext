
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

export interface IPageInfoBasic {
    pageName: 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info' | 'Maintenance Records';
    range: string;
    fieldMap?: ALLFieldNames[];
    idField?: ALLFieldNames;
}
export interface IPageInfo extends IPageInfoBasic {    
    pageLoader?: (params: IBasicImportParams, pageState: IPageStates) => Promise<void>;
    displayItem?: (params: IPageDefPrms,state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number) => JSX.Element | string;
    displayHeader?: (params: IPageDefPrms, state: IPageStates,field: string, key:number) => JSX.Element|string;
}

export interface IItemData {
    val: string;
    obj: any;
}
export interface IDataDetails {
    columns: string[];
    rows: {
        [key: string]:IItemData; //key is of ALLFieldNames
    }[];
}

export interface IPageStates {
    curPage: IPageInfo;
    pageDetails: IDataDetails;
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
    getHouseByAddress: (state: IPageStates, addr: string) => IHouseInfo;

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