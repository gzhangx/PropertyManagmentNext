import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';

export interface IUserInfo {
    name: string;
    token: string;
}
export interface IRootPageState {
    pageStates: { [key: string]: boolean | string };
    setPageStates: Dispatch<SetStateAction<{}>>;
    userInfo: IUserInfo;
    setUserInfo: Dispatch<SetStateAction<IUserInfo>>;
}


const PageNavContext = createContext<IRootPageState>(null);

export const getSideBarKey = name => `sideBar.section.expanded.${name}`; //sidebar expend in page states
export const getSideBarItemKey = name => `sideBar.item.selected.${name}`; //sidebar expend in page states
export const getSideBarCurrentActiveItemKey = () => `sideBar.item.currentSelected`; //sidebar expend in page states

export function RootPageStateWrapper({ children }) {
    const [pageStates, setPageStates] = useState({});
    const [userInfo, setUserInfo] = useState<IUserInfo>({ name:'', token:''});
    const defVal: IRootPageState = {
        pageStates,
        setPageStates,
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