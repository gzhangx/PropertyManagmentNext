
import * as httpRequest from '@gzhangx/googleapi/lib/httpRequest'
import { IGetModelReturn, TableNames, ISqlDeleteResponse } from './types'

export interface ISiteConfig {
    baseUrl: string;
}

let sitConfig:ISiteConfig = null;
export async function getConfig() : Promise<ISiteConfig> {
    const site = process.env.SITE || 'local1';
    const baseURL = process.env.BASE_URL || 'http://192.168.0.40';
    if (sitConfig) return sitConfig;
    sitConfig = {
        baseUrl: `${baseURL}/pmapi`,
    };    
    if (site === 'local') {
        sitConfig.baseUrl = 'http://localhost:8081/pmapi';
    }    
    return sitConfig;
}
//const baseUrlDev = 'http://localhost:8081/pmapi'
//const baseUrl = 'http://192.168.1.41/pmapi'
export const emailRegx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

import { ISqlOrderDef, ILoginResponse } from './types'
import {
    IExpenseData,
    IHouseInfo,
    IPayment,
    ILeaseInfo,
    ITenantInfo,
    IMaintenanceRawData,
    IWorkerInfo,
    IOwnerInfo,
} from './reportTypes';

export async function doPost(path: string, data: object, method: httpRequest.HttpRequestMethod = 'POST', authToken: string = ''): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        //"Authorization": `Bearer ${access_token}`,
    };        
    const auth = authToken || getLoginToken();        
    if (!!auth) {
        headers['Authorization'] = `Bearer ${auth}`;
    }    

    return httpRequest.doHttpRequest({
        url: `${(await getConfig()).baseUrl}/${path}`,
        method,
        headers,
        data,
    }).then(r => {
        return r.data;
    }).catch(err => {
        if (!err.response || !err.response.data) {
            console.log(`axios request with no err response`, path, err);
            throw err;
        }
        const data = err.response.data;
        throw {
            error: `${data.message || ''} ${data.rspErr || ''} ${data.error || ''}`,
        }
    })
    /*
    return axios({
        url: `${(await getConfig()).baseUrl}/${path}`,
        headers,
        method:method || 'POST',
        data,
    }).then(r => {
        return (r.data)
    }).catch(err => {
        if (!err.response || !err.response.data) {
            console.log(`axios request with no err response`, path, err);
            throw err;
        }
        const data = err.response.data;
        throw {
            error: `${data.message || ''} ${data.rspErr || ''} ${data.error || ''}`,
        }
    })
    */
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

    removeLoginToken();
    return doPost(`auth/login`, {
        username,
        password,
    }).then(async (r: ILoginResponse) => {
        if (r.error) return r;
        localStorage.setItem('login.token', r.token);
        localStorage.setItem('login.info', JSON.stringify(r));        
        return r;
    });
}


const fakeLocalStorage: {[name:string]:string} = {};
export function setFakeLocalStorage(name: string, val:string) {
    fakeLocalStorage[name] = val;
}

export function getLoginToken() : string|null {
    //const rState = useRootPageContext();
    //if (rState.userInfo.token) return rState.userInfo.token;
    if (typeof window == 'undefined') {
        //runnng on server
        return fakeLocalStorage['login.token'];
    }
    const token = localStorage.getItem('login.token');    
    if (!token) {
        console.log(`get debugremove login.token got '${token}' typeof token=${typeof token} token=='null'=${token == 'null'} return null`)
        return null;
    }
    return token;
}

export function removeLoginToken() {
    localStorage.removeItem('login.token');
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

//export type TableNames = 'rentPaymentInfo' | 'houseInfo' | 'maintenanceRecords' | 'ownerInfo' | 'leaseInfo' | 'tenantInfo' | 'workerComp';
export interface ISqlRequest {
    table: TableNames;
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
    return doPost(`sql/get?tableDbg=${input.table}`, input);
}

export async function sqlAdd(table: TableNames, fields: { [key: string]: string | number; }, doCreate:boolean) {
    //     "table":"tenantInfo",
    //     "fields":{"tenantID":"289a8120-01fd-11eb-8993-ab1bf8206feb", "firstName":"gang", "lastName":"testlong"},
    //    "create":true
    //return id
    return doPost(`sql/create`, {
        table,
        fields,
        doCreate,
        doUpdate: !doCreate
    })
}

export function sqlDelete(table: TableNames, id: string): Promise<ISqlDeleteResponse>{
    return doPost(`sql/del`, {
        table, id,
    })
}

export async function getModel(name: TableNames) : Promise<IGetModelReturn> {
    return doPost(`getModel?name=${name}`, null, 'GET') as Promise<IGetModelReturn>;
}




export async function getMaintenanceReport(): Promise<IExpenseData[]> {
    return sqlGet({
        //fields:['month', 'houseID','address', {op:'sum', field:'amount', name:'amount'},'expenseCategoryName','displayOrder'],
        fields: ['maintenanceID', 'month', 'houseID', 'address', 'amount', 'expenseCategoryName', 'expenseCategoryId', 'displayOrder', 'date', 'comment', 'description', 'workerID', 'workerFirstName', 'workerLastName', 'hours'],
        table:'maintenanceRecords',
        //groupByArray: [{ field: 'month' }, { field: 'houseID' }, { field: 'address' }, { field: 'expenseCategoryID' }, { field: 'expenseCategoryName'},{field:'displayOrder'}]
    }).then((r: { rows: IExpenseData[]})=>{
        return r.rows.map(r => {
            const expenseCategoryName = r.expenseCategoryName || r.expenseCategoryId;
            return {
                ...r,
                expenseCategoryName,
                category: expenseCategoryName,
            }
        });
    });    
}

export async function getHouseInfo(): Promise<IHouseInfo[]> {
    return sqlGet({
        fields: ['houseID','address','city','zip', 'ownerName'],
        table: 'houseInfo',
        //whereArray: [{
            //field: 'ownerID',
            //op: 'in',
            //val: ownerInfos.map(o=>o.ownerID),
        //}],        
    }).then((r: { rows: IHouseInfo[]; error: string; }) => {
        if (r.error === 'not authorized') {
            throw {
                error: r.error,
            }
        }
        if (!r.rows) {
            console.log(`bad getHouseInfo return`, r);
            return [];
        }        
        return r.rows.filter(x => x.address).map(r => {
            return {
                ...r,
                address: r.address.trim(),
            }
        });
    });    
}

export async function getPaymentRecords(): Promise<IPayment[]> {
    return sqlGet({
        fields: [
            'paymentID',
            'receivedDate',
        'receivedAmount',
        'houseID',
        'paymentTypeName',
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
        return r.rows.filter(x => x.houseID).map(p => {
            const paymentTypeName = p.paymentTypeName || p.paymentTypeID;
            return {
                ...p,
                paymentTypeName,
            }
        })
    });    
}

// Used by cashflow
export async function getPaymnents() : Promise<IPayment[]> {
    return sqlGet({
        table:'rentPaymentInfo',
    }).then((r: {rows:IPayment[]})=>{
        return r.rows.map(r => {
            const paymentTypeName = r.paymentTypeName || r.paymentTypeID;
            return {
                ...r,
                paymentTypeName,
                date: r.receivedDate,
                amount: r.receivedAmount,
            }
        });
    })    
}

export async function getLeases() : Promise<ILeaseInfo[]> {
    return sqlGet({
        table:'leaseInfo',
    }).then((r: {rows:ILeaseInfo[]})=>{
        return r.rows;
    })    
}

export async function getWorkerInfo(): Promise<IWorkerInfo[]> {
    return sqlGet({
        table: 'workerInfo',
    }).then((r: { rows: IWorkerInfo[] }) => {
        return r.rows;
    })
}

export async function getOwnerInfo(): Promise<IOwnerInfo[]> {
    return sqlGet({
        table: 'ownerInfo',
    }).then((r: { rows: IOwnerInfo[] }) => {
        return r.rows;
    })
}

export async function deleteLeases(leaseID:string) {
    return sqlDelete('leaseInfo', leaseID);
}


export async function getTenants(): Promise<ITenantInfo[]> {
    return sqlGet({
        table: 'tenantInfo',
        //whereArray: [{
        //    field: 'ownerID',
        //    op: 'in',
        //    val: ownerInfos.map(o => o.ownerID),
        //}]
    } as ISqlRequest).then((r: { rows: ITenantInfo[] }) => {
        return r.rows;
    });
}

export async function deleteById(tableName: TableNames, id: string) {
    return sqlDelete(tableName, id);
}



export async function googleSheetRead(id:string, op:string, range:string) : Promise<{
    values: string[][];
}>{
    return doPost(`misc/sheet/${op}/${id}/${range}`, {}).then(r => {
        return r;
    })
}


export async function getMaintenanceFromSheet(): Promise<IMaintenanceRawData[]> {
    const rpt = await getMaintenanceReport();
    return rpt.map(r => r as IMaintenanceRawData);
    //const data = await doPost(`misc/sheet/readMaintenanceRecord?sheetId=${sheetId}&sheetName=${sheetName}`, {}, 'GET');
    //if (!data.values) {
    //    return [];
    //}
    // const noHeader = data.values.slice(1);
    // if (sheetName === 'Workers Info') {
    //     return noHeader.map(n => {
    //         return {
    //             workerID: n[1],
    //         } as IMaintenanceRawData
    //     });
    // }
    // return noHeader.map(row => {
    //     if (!row[2]) {
    //         console.log('bad row', row);
    //         return null;
    //     }
    //     const amountRow = row[2].replace(/[$,]/g, '').trim();
    //     const [matched] = amountRow.matchAll(/\(([0-9.]+?)\)/g);
    //     let amount = amountRow;
    //     if (matched) {
    //         amount = -parseFloat(matched[1]);
    //     } else {
    //         amount = parseFloat(amountRow);
    //     }
    //     if (isNaN(amount)) {
    //         console.log('bad row nama amont', row);
    //         return null;
    //     }
    //     return {
    //         amount,
    //         date: moment(row[0]).format('YYYY-MM-DD'),
    //         description: (row[1] || '').trim(),
    //         houseID: (row[3] || '').trim(),
    //         expenseCategoryId: (row[4] || '').trim(),
    //         workerID: (row[5] || '').trim(),
    //         comment: (row[6] || '').trim(),
    //     } as IMaintenanceRawData;
    // }).filter(x => x);
}


interface IGoogleAuthInfo {
    private_key_id: string;
    private_key: string;
    client_email: string;
}

export type IGoogleSheetAuthInfo = {
    googleSheetId: string;
} & IGoogleAuthInfo;

export async function getSheetAuthInfo(): Promise<IGoogleSheetAuthInfo> {
    const googleAuthInfos = await sqlGet({
        table: 'googleApiCreds',
    }).then((r: { rows: IGoogleSheetAuthInfo[], error: string }) => {        
        return r.rows;
    });
    return googleAuthInfos[0];
}

export async function saveGoodSheetAuthInfo(authInfo: IGoogleSheetAuthInfo) {
    await doPost('misc/sheet/saveSheetAuthData', {
        authInfo,
    });
}


export async function updateSheet(op: 'update' | 'append', id: string, range: string, data: string[][]) {
    return await doPost(`misc/sheet/${op}/${id}/${range}`, data);
}