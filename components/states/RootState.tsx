import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';
//import {IPageState} from '../types'
import { getLoginInfo } from '../api'
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

export function RootPageStateWrapper({ children }) {
    const [sideBarStates, setSideBarStates] = useState({});
    //const [pageProps, setPageProps] = useState({});
    const [userInfo, setUserInfo] = useState<ILoginResponse>(getLoginInfo() || { id: 0, name:'', token:'',ownerPCodes:[],});
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