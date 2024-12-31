
import { IHouseInfo, IPayment, ITenantInfo } from '../../reportTypes';
import moment from 'moment';
import { IDBFieldDef, ISqlDeleteResponse, TableNames } from '../../types';

import type { JSX } from "react";
import { ALLFieldNames, ITableAndSheetMappingInfo, PageNames } from '../../uidatahelpers/datahelperTypes';


export interface IPaymentWithArg extends IPayment
{
    processed: boolean;
    matchNotes: string;
    invalid: boolean;
    invalidDesc: string;
}

export interface IColumnTypes {
    colType: 'string' | 'number' | 'houseAddress' | 'tenantName' | 'workerName' | 'dateYYYY-MM-DD';
}

export interface IColumnInfoLookup {
    [name: string]: IColumnTypes;
}

export interface IDisplayColumnInfo {
    field: ALLFieldNames;
    name: string;
    type?: string;
}

export interface IDbSaveData {
    [key: string]: string | number | null; //key is of ALLFieldNames
}

export interface IDbInserter {
    name: string;
    createEntity: (data: IDbSaveData) => Promise<{id:string}>;
}


export interface IPageInfo extends ITableAndSheetMappingInfo {    
    displayColumnInfo?: IDisplayColumnInfo[];
    dbLoader?: () => Promise<IDbSaveData[]>;
    //dbItemIdField?: ALLFieldNames;
    //extraProcessSheetData?: (pageData: ISheetRowData[], pageState: IPageStates) => Promise<ISheetRowData[]>;
    sheetMustExistField?: ALLFieldNames;
    showCreateButtonColumn?: ALLFieldNames;
    //dbInserter?: IDbInserter;
    //deleteById?: (ids: string[]) => Promise<ISqlDeleteResponse>;
    
    //displayItem?: (params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames) => JSX.Element;
    //displayDbExtra?: (params: IPageParms, state: IPageStates, dbMatch: IDbRowMatchData, field: ALLFieldNames) => JSX.Element | number| string;
    cmpSortField?: ALLFieldNames; //used to show sheet/db rows and sort by, usually date

    //custProcessSheetData?: (sheetData: ICompRowData[], pageState: IPageStates) => IStringDict[];

    //rowComparer?: IRowComparer;
}


export interface IStringDict {
    [key: string]: string | number; //key is of ALLFieldNames
}

export type ROWDataType = 'DB' | 'Sheet';

export type SheetIdFieldNames = '' | 'workerID' | 'tenantID';
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
    sheetIdField: SheetIdFieldNames;

    matchedById: SheetIdFieldNames; //when it is matched by Id for items that has an id on sheet
}

export interface IDbRowMatchData {
    dbItemData: IDbSaveData;
    dataType: ROWDataType;
    matchedToKey: string;
    displayData?: IStringDict;

    invalid?: string; //not used, matching ISheetRowData
}

export type ICompRowData = ISheetRowData | IDbRowMatchData;

export interface IPageDataDetails {
    sheetIdField: SheetIdFieldNames;
    dataRows: ISheetRowData[];
    //colNames: IStringDict;
    dbMatchData?: IDbRowMatchData[];
    customData?: any; //used by lease to track tenant address etc
}

export interface IPageStates {
    curPage: IPageInfo;
    pageDetails: IPageDataDetails;
    sheetId: string; //not in state, passed around
    //selectedOwners: IOwnerInfo[]; //not in state, passed around

    missingOwnersByName: { [ownerName: string]: boolean };
    housesByAddress: { [address: string]: IHouseInfo };
    housesById: { [houseID: string]: IHouseInfo };
    houses: IHouseInfo[];
    payments: IPaymentWithArg[];
    tenants: ITenantInfo[];
    tenantByName: { [fname: string]: ITenantInfo };
    //paymentsByDateEct: { [key: string]: IPaymentWithArg[] };
    stateReloaded: number;
    showMatchedItems: boolean;
}



export function getHouseByAddress(state: IPageStates, addr: string) {
    if (!addr) return null;
    return state.housesByAddress[addr.toLowerCase().trim()]
}

export interface IPageParms {
    dispatchCurPageState: React.Dispatch<(state: IPageStates) => IPageStates>;
    refreshTenants: () => Promise<void>;
    setDlgContent: React.Dispatch<React.SetStateAction<JSX.Element>>;
    setErrorStr: (text: string) => void;
    showProgress: (msg: any) => void;
}

export interface IRowComparer {
    name: string;
    getRowKey: (data: IDbSaveData, source:'DB'|'Sheet') => string;
    //checkRowValid?: (data: IDbSaveData) => string | null;
}

export function YYYYMMDDFormater(date: string) : string {
    return moment(date).format('YYYY-MM-DD');
}