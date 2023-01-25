
import {httpRequest } from '@gzhangx/googleapi'
import { IGetModelReturn, TableNames, ISqlDeleteResponse } from './types'
import moment from 'moment';

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
        baseUrl: 'http://192.168.0.41/pmapi',
        redirectUrl: 'http://localhost:3000',
        googleClientId: '',
    };    
    if (site === 'local') {
        sitConfig.baseUrl = 'http://localhost:8081/pmapi';
        sitConfig.redirectUrl = 'http://localhost:3000';
    }
    if (getLoginToken()) {
        const cliInfo = await getGoogleClientId();
        sitConfig.googleClientId = cliInfo.client_id;
    }
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
    ITenantInfo,
    IMaintenanceRawData,
} from './reportTypes';

export async function doPost(path: string, data: object, method: httpRequest.HttpRequestMethod = 'POST', authToken: string = ''): Promise<any> {
    const headers = {
        "Content-Type": "application/json",
        //"Authorization": `Bearer ${access_token}`,
    };
    const auth = authToken || getLoginToken();
    if (auth) {
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


const fakeLocalStorage: {[name:string]:string} = {};
export function setFakeLocalStorage(name: string, val:string) {
    fakeLocalStorage[name] = val;
}

export function getLoginToken() : string {
    //const rState = useRootPageContext();
    //if (rState.userInfo.token) return rState.userInfo.token;
    if (typeof window == 'undefined') {
        //runnng on server
        return fakeLocalStorage['login.token'];
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

export async function sqlAdd(table: TableNames, fields: { [key: string]: string | number; }, create:boolean) {
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

export function sqlDelete(table: TableNames, id: string): Promise<ISqlDeleteResponse>{
    return doPost(`sql/del`, {
        table, id,
    })
}

export async function getModel(name: TableNames) : Promise<IGetModelReturn> {
    return doPost(`getModel?name=${name}`, null, 'GET') as Promise<IGetModelReturn>;
}




export async function getMaintenanceReport(ownerInfos: IOwnerInfo[]): Promise<IExpenseData[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        //fields:['month', 'houseID','address', {op:'sum', field:'amount', name:'amount'},'expenseCategoryName','displayOrder'],
        fields: ['month', 'houseID', 'address', 'amount', 'expenseCategoryName', 'expenseCategoryId', 'displayOrder', 'date', 'comment', 'description', 'workerID', 'workerFirstName', 'workerLastName'],
        table:'maintenanceRecords',
        whereArray:[{
            field:'ownerID',
            op: 'in',
            val: ownerInfos.map(o=>o.ownerID),
        }],
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

export async function deleteLeases(leaseID:string) {
    return sqlDelete('leaseInfo', leaseID);
}

// Used by cashflow
export async function getOwners() : Promise<IOwnerInfo[]> {
    return sqlGet({
        table:'ownerInfo',        
    } as ISqlRequest).then((r: { rows: IOwnerInfo[], error: string }) => {
        if (r.error) {
            console.log('has error', r);
            throw r;
        }
        return r.rows;
    });    
}

export async function getTenants(ownerInfos: IOwnerInfo[]): Promise<ITenantInfo[]> {
    if (!ownerInfos || !ownerInfos.length) return [];
    return sqlGet({
        table: 'tenantInfo',
        whereArray: [{
            field: 'ownerID',
            op: 'in',
            val: ownerInfos.map(o => o.ownerID),
        }]
    } as ISqlRequest).then((r: { rows: ITenantInfo[] }) => {
        return r.rows;
    });
}

export async function deleteById(tableName: TableNames, id: string) {
    return sqlDelete(tableName, id);
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

type MaintenanceRecordSheetName = 'Workers Info' | 'MaintainessRecord';
export async function getMaintenanceFromSheet(sheetName: MaintenanceRecordSheetName) : Promise<IMaintenanceRawData[]> {
    const data = await doPost(`misc/sheet/readMaintenanceRecord?sheetId=${sheetName}`, {}, 'GET');
    const noHeader = data.values.slice(1);
    if (sheetName === 'Workers Info') {
        return noHeader.map(n => {
            return {
                workerID: n[1],
            } as IMaintenanceRawData
        });
    }
    return noHeader.map(row => {
        if (!row[2]) {
            console.log('bad row', row);
            return null;
        }
        const amountRow = row[2].replace(/[$,]/g, '').trim();
        const [matched] = amountRow.matchAll(/\(([0-9.]+?)\)/g);
        let amount = amountRow;
        if (matched) {
            amount = -parseFloat(matched[1]);
        } else {
            amount = parseFloat(amountRow);
        }
        if (isNaN(amount)) {
            console.log('bad row nama amont', row);
            return null;
        }
        return {
            amount,
            date: moment(row[0]).format('YYYY-MM-DD'),
            description: (row[1] || '').trim(),
            houseID: (row[3] || '').trim(),
            expenseCategoryId: (row[4] || '').trim(),
            workerID: (row[5] || '').trim(),
            comment: (row[6] || '').trim(),
        } as IMaintenanceRawData;
    }).filter(x => x);
}