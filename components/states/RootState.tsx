import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';
//import {IPageState} from '../types'
export interface IUserInfo {
    id: number;
    name: string;
    token: string;
}
export interface IRootPageState {
    sideBarStates: { [key: string]: boolean | string };
    setSideBarStates: Dispatch<SetStateAction<{}>>;
    //pageState: IPageState;         
    userInfo: IUserInfo;
    setUserInfo: Dispatch<SetStateAction<IUserInfo>>;
}


const PageNavContext = createContext<IRootPageState>(null);

const SIDEBAR_SELECTED_ITEM_PREFIX='sideBar.item.selected.';
export const getSideBarKey = name => `sideBar.section.expanded.${name}`; //sidebar expend in page states
export const getSideBarItemKey = name => `${SIDEBAR_SELECTED_ITEM_PREFIX}${name}`; //sidebar expend in page states
export const getSideBarCurrentActiveItemKey = () => `sideBar.item.currentSelected`; //sidebar expend in page states
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
    const [userInfo, setUserInfo] = useState<IUserInfo>({ id: 0, name:'', token:''});
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