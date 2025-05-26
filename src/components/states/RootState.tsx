'use client'
import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';
//import {IPageState} from '../types'

import { ILoginResponse } from '../types';

export interface IRootPageState {
    sideBarStates: { [key: string]: boolean | string };
    setSideBarStates: Dispatch<SetStateAction<{}>>;
    //pageState: IPageState;         
    userInfo: ILoginResponse;
    setUserInfo: Dispatch<SetStateAction<ILoginResponse>>;
    isLoggedIn: () => boolean;
    doLogout: () => void;

    checkLoginExpired: (apiRes:any) => boolean;
}


const PageNavContext = createContext<IRootPageState>(null as any as IRootPageState);

const SIDEBAR_SELECTED_ITEM_PREFIX='sideBar.item.selected.';
export const getSideBarKey = (name: string) => `sideBar.section.expanded.${name}`; //sidebar expend in page states
export const getSideBarItemKey = (name: string) => `${SIDEBAR_SELECTED_ITEM_PREFIX}${name}`; //sidebar expend in page states
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

export function getLoginInfo(): ILoginResponse | null {
    if (typeof window == 'undefined') {
        //runnng on server
        return null;
    }
    const infoStr = localStorage.getItem('login.info');
    if (!infoStr) return null;
    const res = JSON.parse(infoStr) as ILoginResponse;
    if (!res.name) {
        res.name = localStorage.getItem('login.name') as string;
    }
    return res;
}

export function RootPageStateWrapper(props: { children: any }) {
    const children = props.children;
    const [sideBarStates, setSideBarStates] = useState({});
    //const [pageProps, setPageProps] = useState({});
    const [userInfo, setUserInfo] = useState<ILoginResponse>(getLoginInfo() || { id: '', name:'', token:'', timezone: 'America/New_York'});
    const defVal: IRootPageState = {
        sideBarStates,
        setSideBarStates,
        //pageState: {
        //    pageProps,
        //    setPageProps,
        //},
        userInfo,
        setUserInfo,
        isLoggedIn: () => {
            return !!(userInfo.id && userInfo.token);
        },
        doLogout: () => {
            localStorage.removeItem('login.token')
            setUserInfo({
                ...userInfo,
                id: '',
                token: '',
            });            
        },
        checkLoginExpired: (apiRes) => {
            if (apiRes.error === 'not authorized') {
                setUserInfo(old => {
                    return {
                        ...old,
                        id: '',
                        token: ''
                    };
                });
                return true;
            }
            return false;
        },
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


export function navgateToWithState(state: IRootPageState, name: string, e: any) {
    e.preventDefault();
    activeSideBarItem(state, name);
}