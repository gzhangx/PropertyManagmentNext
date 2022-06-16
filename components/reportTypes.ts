import { IPagePropsByTable, IPageState } from './types'
import {IEditTextDropdownItem} from './generic/EditTextDropdown'
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

export interface IOwnerInfo {
    ownerID: number;
    ownerName: string;
    shortName: string;
    googleSheetId: string;
    selected: boolean;
}

export interface IHouseInfo {
    houseID: string;
    ownerID: number;
    address: string;
    city: string;
    state: string;
    zip: string;
}


export interface IExpenseData {
    address: string;
    amount: number;
    category: string;
    comment: string;
    date: string;
    description: string;
    expenseCategoryName: string;
    houseID: string;
    month: string;
}

export interface IExpenseCategory {
    expenseCategoryID: string;
    expenseCategoryName: string;
    displayOrder: string;
}

export interface IWorkerInfoShort {
    workerID: string;
    firstName: string;
    lastName: string;
}
export interface IWorkerInfo extends IWorkerInfoShort {
    //workerID: string;
    //firstName: string;
    //lastName: string;
    email: string;
    phone: string;
    taxID: string;
    address: string;
    vdPosControl: string;
}

export interface IHouseAnchorInfo {
    address: string;
    id: string;
    isAnchor: boolean;
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
    getHouseShareInfo: () => IHouseAnchorInfo[];
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
    workerFirstName: string;
    workerLastName: string;
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

export interface IIncomeExpensesContextValue {
    pageState: IPageState;
    //pageProps: IPagePropsByTable;
    //setPageProps: (a: IPagePropsByTable) => void;
    selectedOwners: IOwnerInfo[];
    setSelectedOwners: (a: IOwnerInfo[]) => void;
    allOwners: IOwnerInfo[];
    rawExpenseData: IExpenseData[];
    payments: IPayment[];
    allMonthes: string[];
    allHouses: IHouseInfo[];
    houseAnchorInfo: IHouseAnchorInfo[];
    monthes: string[];
    setMonthes: (a: string[]) => void;
    curMonthSelection: any;
    setCurMonthSelection: (a: IEditTextDropdownItem) => void;
    selectedMonths: { [mon: string]: boolean };
    setSelectedMonths: (a: { [mon: string]: boolean }) => void;
    selectedHouses: {[id:string]:boolean};
    setSelectedHouses: (a: any) => void;
    beginReLoadPaymentData: (o: IOwnerInfo[]) => Promise<void>;
    paymentCalcOpts: IPaymentCalcOpts;
}