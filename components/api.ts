
const baseUrl = 'http://localhost:8081/pmapi'
export const emailRegx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

async function doPost(path: string, data: object): Promise<any> {    
    const pdata = {
        method: 'POST',
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
        if (!r.name) r.name = username;
        localStorage.setItem('login.info', JSON.stringify(r));
        return r;
    });    
}

export function getLoginToken() {
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
