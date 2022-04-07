
import { IOwnerInfo, IHouseInfo, IPayment } from '../../reportTypes';

export type ALLFieldNames = '' | 'address' | 'city' | 'zip' | 'ownerName' | 'receivedDate' | 'receivedAmount' | 'houseID' | 'paymentTypeID' | 'paymentProcessor' | 'notes';

export interface IPaymentWithArg extends IPayment
{
    processed: boolean;
}

export interface IPageInfo {
    pageName: 'Tenants Info' | 'Lease Info' | 'PaymentRecord' | 'House Info';
    range: string;
    fieldMap?: ALLFieldNames[];
    idField?: ALLFieldNames;
    pageLoader?: (pageState: IPageStates) => Promise<void>;
    displayItem?: (state: IPageStates, field: string, itm: IItemData, all: { [key: string]: IItemData }, rowInd: number) => JSX.Element | string;
    displayHeader?: (state: IPageStates,field: string, key:number) => JSX.Element|string;
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

    existingOwnersByName: { [ownerName: string]: IOwnerInfo };
    existingOwnersById: { [ownerId: number]: IOwnerInfo };
    missingOwnersByName: { [ownerName: string]: boolean };
    housesByAddress: { [ownerName: string]: IHouseInfo };
    houses: IHouseInfo[];
    payments: IPaymentWithArg[];
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