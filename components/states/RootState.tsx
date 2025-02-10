import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';
//import {IPageState} from '../types'

import { ILoginResponse } from '../types';

export interface IRootPageState {
    sideBarStates: { [key: string]: boolean | string };
    setSideBarStates: Dispatch<SetStateAction<{}>>;
    //pageState: IPageState;         
    userInfo: ILoginResponse;
    setUserInfo: Dispatch<SetStateAction<ILoginResponse>>;
}


const PageNavContext = createContext<IRootPageState>(null);

const SIDEBAR_SELECTED_ITEM_PREFIX='sideBar.item.selected.';
export const getSideBarKey = name => `sideBar.section.expanded.${name}`; //sidebar expend in page states
export const getSideBarItemKey = name => `${SIDEBAR_SELECTED_ITEM_PREFIX}${name}`; //sidebar expend in page states
export const getSideBarCurrentActiveItemKey = () => `sideBar.item.currentSelected`; //sidebar expend in page states

export function activeSideBarItem(rs: IRootPageState, name: string) {
    const itemName = getSideBarItemKey(name);
    rs.sideBarStates[getSideBarCurrentActiveItemKey()] = itemName;
    rs.setSideBarStates({ ...rs.sideBarStates });
}

export function isSidebarItemActive(rs: IRootPageState, name: string) {
    const itemName = getSideBarItemKey(name);
    return rs.sideBarStates[getSideBarCurrentActiveItemKey()] === itemName;
}

export const getSideBarCurrentSelectedItemName = (ctx:IRootPageState)=>{
    const name = ctx.sideBarStates[getSideBarCurrentActiveItemKey()];
    if (!name) return null;
    if (typeof name === 'string') {
        return name.substring(SIDEBAR_SELECTED_ITEM_PREFIX.length);
    }
    return null;
}

export function getLoginInfo(): ILoginResponse {
    if (typeof window == 'undefined') {
        //runnng on server
        return null;
    }
    const infoStr = localStorage.getItem('login.info');
    if (!infoStr) return null;
    const res = JSON.parse(infoStr) as ILoginResponse;
    if (!res.name) {
        res.name = localStorage.getItem('login.name');
    }
    return res;
}

export function RootPageStateWrapper({ children }) {
    const [sideBarStates, setSideBarStates] = useState({});
    //const [pageProps, setPageProps] = useState({});
    const [userInfo, setUserInfo] = useState<ILoginResponse>(getLoginInfo() || { id: '', name:'', token:'',});
    const defVal: IRootPageState = {
        sideBarStates,
        setSideBarStates,
        //pageState: {
        //    pageProps,
        //    setPageProps,
        //},
        userInfo,
        setUserInfo,
    }
    return (
        <PageNavContext.Provider value= { defVal } >
            { children }
        </PageNavContext.Provider>
    );
}

export function useRootPageContext(): IRootPageState {
    return useContext(PageNavContext);
}


export function checkLoginExpired(rootCtx: IRootPageState, res: {error?: string}) {
    if (res.error === 'not authorized') {
        rootCtx.setUserInfo(old => {
            return {
                ...old,
                id: '',
                token: ''
            };
        })
    }
}