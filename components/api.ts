
const baseUrl = 'http://localhost:8081/pmapi'
export const emailRegx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

async function doPost(path: string, data: object, method?:string): Promise<any> {    
    const pdata = {
        method: method || 'POST',
        headers: {
            'Content-Type': 'application/json',            
        },
        body: JSON.stringify(data),
    };
    const auth = getLoginToken();
    if (auth) {
        pdata.headers['Authorization'] = `Bearer ${auth}`;
    }
    return fetch(`${baseUrl}/${path}`, pdata).then(r => {
        return r.json();
    })
}

export interface ILoginResponse {
    error: string;
    token: string;
    name: string;
}
export async function loginUserSetToken(username: string, password: string): Promise<ILoginResponse> {
    console.log('in login')
    
    return doPost(`auth/login`, {
        username,
        password,
    }).then((r: ILoginResponse) => {
        console.log(r);
        if (r.error) return r;
        localStorage.setItem('login.token', r.token);        
        localStorage.setItem('login.info', JSON.stringify(r));        
        return r;
    });    
}

export function getLoginToken() {
    //const rState = useRootPageContext();
    //if (rState.userInfo.token) return rState.userInfo.token;
    const token = localStorage.getItem('login.token');
    if (!token) return null;
    return token;
}

interface ILoginInfo {
    username: string;
    name: string;
}
export function getLoginInfo(): ILoginInfo{
    const infoStr = localStorage.getItem('login.info');
    return JSON.parse(infoStr) as ILoginInfo;
}

export async function registerUser({ username, firstName, lastName }) {
    console.log('in register')
    
}



export async function resetPassword({ username }) {
    console.log('in reset')
    
}


//copied from sql.ts
export interface ISqlRequestFieldDef {
    field: string;
    op: string;
    name: string;
}
export interface ISqlOrderDef {
    name: string;
    op: 'asc' | 'desc';
}

export interface ISqlRequestWhereItem {
    field: string;
    op: string;
    val: string | number | (string | number)[];
}

export interface ISqlRequest {
    table: string;
    fields: (ISqlRequestFieldDef | string)[];
    joins: any;
    order: ISqlOrderDef[];
    whereArray: ISqlRequestWhereItem[];
    groupByArray: {
        field: string;
    }[];
    offset: number | string;
    rowCount: number | string;
}


export async function sqlGet(input: ISqlRequest) : Promise<any> {
    return doPost(`auth/login`, input);
}

export async function sqlAdd(table, fields, create) {
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

export async function getModel(name: string) {
    return doPost(`getModel?name=${name}`, null, 'GET');
}