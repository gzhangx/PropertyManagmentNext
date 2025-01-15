import { IGetModelReturn, IPagePropsByTable, IPageState, TableNames } from './types'
import { IGoogleSheetAuthInfo } from './api';
import { IEditTextDropdownItem } from './generic/GenericDropdown';
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
    vdPosControl: string;
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
}

export interface ILeaseInfo {
    'leaseID': string;
    'deposit': number;
    'petDeposit': number;
    'otherDeposit': number;
    'endDate': string;
    'startDate': string;
    'houseID': string;
    ownerID: number;
    tenantID: string;
    comment: string;
    monthlyRent: number;
}

export interface ITenantInfo {
    tenantID: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    email: string;
    ownerID: number;
    houseID: string;
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
    setModels: React.Dispatch<React.SetStateAction<IModelsDict>>;
}
export interface IIncomeExpensesContextValue {
    pageState: IPageState;
    //pageProps: IPagePropsByTable;
    //setPageProps: (a: IPagePropsByTable) => void;
    //selectedOwners: IOwnerInfo[];
    //setSelectedOwners: (a: IOwnerInfo[]) => void;
    googleSheetAuthInfo: IGoogleSheetAuthInfo;  
    setGoogleSheetAuthinfo: (auth: IGoogleSheetAuthInfo) => void;
    reloadGoogleSheetAuthInfo: () => Promise<IGoogleSheetAuthInfo>;
    loginError: string;
    setLoginError: (s: string) => void;
    //allOwners: IOwnerInfo[];
    rawExpenseData: IExpenseData[];
    payments: IPayment[];
    allMonthes: string[];
    allHouses: IHouseInfo[];
    monthes: string[];
    setMonthes: (a: string[]) => void;
    curMonthSelection: any;
    setCurMonthSelection: (a: IEditTextDropdownItem) => void;
    selectedMonths: { [mon: string]: boolean };
    setSelectedMonths: (a: { [mon: string]: boolean }) => void;
    selectedHouses: {[id:string]:boolean};
    setSelectedHouses: (a: any) => void;
    beginReLoadPaymentData: () => Promise<void>;
    paymentCalcOpts: IPaymentCalcOpts;

    modelsProp: IModelsProps;

    forceReload: () => void;
}