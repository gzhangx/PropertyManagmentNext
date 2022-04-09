
import axios, { Method } from 'axios';
import { IGetModelReturn, TYPEDBTables } from './types'

export interface ISiteConfig {
    baseUrl: string;
    googleClientId: string;
    redirectUrl: string;
}
let sitConfig:ISiteConfig = null;
export async function getConfig() : Promise<ISiteConfig> {
    const site = "local1" || process.env.SITE;
    if (sitConfig) return sitConfig;
    sitConfig = {
        baseUrl: 'http://192.168.1.41/pmapi',
        redirectUrl: 'http://localhost:3000',
        googleClientId: '',
    };    
    if (site === 'local') {
        sitConfig.baseUrl = 'http://localhost:8081/pmapi';
        sitConfig.redirectUrl = 'http://localhost:3000';
    }
    const cliInfo = await getGoogleClientId();
    sitConfig.googleClientId = cliInfo.client_id;
    return sitConfig;
}
//const baseUrlDev = 'http://localhost:8081/pmapi'
//const baseUrl = 'http://192.168.1.41/pmapi'
export const emailRegx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

import { ISqlOrderDef, ILoginResponse } from './types'
import {
    IHouseAnchorInfo, IOwnerInfo,
    IExpenseData,
    IHouseInfo,
    IPayment,
    ILeaseInfo,
} from './reportTypes';

async function doPost(path: string, data: object, method?: Method): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        //"Authorization": `Bearer ${access_token}`,
    };
    const auth = getLoginToken();
    if (auth) {
        headers['Authorization'] = `Bearer ${auth}`;
    }
    return axios({
        url: `${(await getConfig()).baseUrl}/${path}`,
        headers,
        method:method || 'POST',
        data,
    }).then(r => {
        return (r.data)
    });       
    /*
    const pdata = {
        method: method || 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        //body: JSON.stringify(data),
    } as any;
    if (pdata.method === 'POST' && data) {
        pdata.body = JSON.stringify(data);
    }
    const auth = getLoginToken();
    if (auth) {
        pdata.headers['Authorization'] = `Bearer ${auth}`;
    }
    return fetch(`${baseUrl}/${path}`, pdata).then(r => {
        return r.json();
    })
    */
}


export async function loginUserSetToken(username: string, password: string): Promise<ILoginResponse> {
    console.log('in login')

    return doPost(`auth/login`, {
        username,
        password,
    }).then((r: ILoginResponse) => {
        if (r.error) return r;
        localStorage.setItem('login.token', r.token);
        localStorage.setItem('login.info', JSON.stringify(r));
        return r;
    });
}

export function getLoginToken() {
    //const rState = useRootPageContext();
    //if (rState.userInfo.token) return rState.userInfo.token;
    if (typeof window == 'undefined') {
        //runnng on server
        return null;
    }
    const token = localStorage.getItem('login.token');
    if (!token) return null;
    return token;
}


export function getLoginInfo(): ILoginResponse {
    if (typeof window == 'undefined') {
        //runnng on server
        return null;
    }
    const infoStr = localStorage.getItem('login.info');
    if (!infoStr) return null;
    return JSON.parse(infoStr) as ILoginResponse;
}

export async function registerUser({ username, firstName, lastName }) {
    console.log('in register')

}



export async function resetPassword({ username }) {
    console.log('in reset')

}

export type SQLOPS = '>' | '>=' | '=' | '<' | '<=' | '!=' | '<>' | 'in';
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

export interface ISqlRequest {
    table: 'rentPaymentInfo' | 'houseInfo' | 'maintenanceRecords' | 'ownerInfo' | 'leaseInfo';
    fields?: (ISqlRequestFieldDef | string)[];
    joins?: any;
    order?: ISqlOrderDef[];
    whereArray?: ISqlRequestWhereItem[];
    groupByArray?: {
        field: string;
    }[];
    offset?: number | string;
    rowCount?: number | string;
}


export async function sqlGet(input: ISqlRequest): Promise<any> {
    return doPost(`sql/get`, input);
}

export async function sqlAdd(table: string, fields: { [key: string]: string | number; }, create:boolean) {
    //     "table":"tenantInfo",
    //     "fields":{"tenantID":"289a8120-01fd-11eb-8993-ab1bf8206feb", "firstName":"gang", "lastName":"testlong"},
    //    "create":true
    //return id
    return doPost(`sql/create`, {
        table,
        fields,
        create,
    })
}

export function sqlDelete(table, id) {
    return doPost(`sql/del`, {
        table, id,
    })
}

export async function getModel(name: TYPEDBTables) : Promise<IGetModelReturn> {
    return doPost(`getModel?name=${name}`, null, 'GET') as Promise<IGetModelReturn>;
}




export async function getMaintenanceReport(ownerInfos: IOwnerInfo[]): Promise<IExpenseData[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        //fields:['month', 'houseID','address', {op:'sum', field:'amount', name:'amount'},'expenseCategoryName','displayOrder'],
        fields: ['month', 'houseID', 'address', 'amount', 'expenseCategoryName', 'displayOrder', 'date', 'comment', 'description'],
        table:'maintenanceRecords',
        whereArray:[{
            field:'ownerID',
            op: 'in',
            val: ownerInfos.map(o=>o.ownerID),
        }],
        //groupByArray: [{ field: 'month' }, { field: 'houseID' }, { field: 'address' }, { field: 'expenseCategoryID' }, { field: 'expenseCategoryName'},{field:'displayOrder'}]
    }).then((r: { rows: IExpenseData[]})=>{
        return r.rows.map(r=>{
            return {
                ...r,
                category: r.expenseCategoryName,
            }
        });
    });    
}

export async function getHouseAnchorInfo(ownerInfos: IOwnerInfo[]): Promise<IHouseAnchorInfo[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        fields: ['houseID','address'],
        table: 'houseInfo',
        whereArray: [{
            field: 'ownerID',
            op: 'in',
            val: ownerInfos.map(o=>o.ownerID),
        }],        
    }).then((r: { rows: IHouseInfo[]}) => {
        return r.rows.map(r => {
            return {
                id: r.houseID,
                address: r.address,
                isAnchor: r.address.includes('1633'),
            } as IHouseAnchorInfo;
        }).filter(x=>x.address);
    });    
}

export async function getHouseInfo(): Promise<IHouseInfo[]> {
    return sqlGet({
        fields: ['houseID','address','city','zip', 'ownerID'],
        table: 'houseInfo',
        //whereArray: [{
            //field: 'ownerID',
            //op: 'in',
            //val: ownerInfos.map(o=>o.ownerID),
        //}],        
    }).then((r: { rows: IHouseInfo[]}) => {
        return r.rows.filter(x=>x.address);
    });    
}

export async function getPaymentRecords(): Promise<IPayment[]> {
    return sqlGet({
        fields: [ 'receivedDate',
        'receivedAmount',
        'houseID',
        'paymentTypeID',
        'paymentProcessor',                
        //'paidBy',
        'notes',
            'ownerID'
        ],
        table: 'rentPaymentInfo',
        //whereArray: [{
            //field: 'ownerID',
            //op: 'in',
            //val: ownerInfos.map(o=>o.ownerID),
        //}],        
    }).then((r: { rows: IPayment[]}) => {
        return r.rows.filter(x=>x.houseID);
    });    
}

// Used by cashflow
export async function getPaymnents(ownerInfos: IOwnerInfo[]) : Promise<IPayment[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        table:'rentPaymentInfo',
        whereArray:[{
            field:'ownerID',
            op: 'in',
            val: ownerInfos.map(o=>o.ownerID),
        }]
    }).then((r: {rows:IPayment[]})=>{
        return r.rows.map(r=>{
            return {
                ...r,
                date: r.receivedDate,
                amount: r.receivedAmount,
            }
        });
    })    
}

export async function getLeases(ownerInfos: IOwnerInfo[]) : Promise<ILeaseInfo[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        table:'leaseInfo',
        whereArray:[{
            field:'ownerID',
            op: 'in',
            val: ownerInfos.map(o=>o.ownerID),
        }]
    }).then((r: {rows:ILeaseInfo[]})=>{
        return r.rows;
    })    
}

// Used by cashflow
export async function getOwners() : Promise<IOwnerInfo[]> {
    return sqlGet({
        table:'ownerInfo',        
    } as ISqlRequest).then((r: {rows:IOwnerInfo[]})=>{
        return r.rows;
    });    
}

export interface IGoogleToken {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
}
export async function createGoogleAuth(code:string, redirectUrl:string) : Promise<IGoogleToken>{
    return doPost(`google/token`, {
        code, redirectUrl,
    }).then((r: IGoogleToken) => {
        console.log(r);
        return r;
    });
}

export async function getGoogleClientId() {
    return doPost(`google/clientId`, null, 'GET').then(r => {
        return r as {
            client_id: string;
        };
    })
}

export async function googleSheetRead(id:string, op:string, range:string) : Promise<{
    values: string[][];
}>{
    return doPost(`misc/sheet/${op}/${id}/${range}`, {}).then(r => {
        return r;
    })
}