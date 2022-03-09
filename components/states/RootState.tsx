import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';

export interface IUserInfo {
    userName: string;
    authenticated: boolean;
}
export interface IRootPageState {
    pageStates: { [key: string]: boolean };
    setPageStates: Dispatch<SetStateAction<{}>>;
    userInfo: IUserInfo;
    setUserInfo: Dispatch<SetStateAction<IUserInfo>>;
}


const PageNavContext = createContext<IRootPageState>(null);

export function RootPageStateWrapper({ children }) {
    const [pageStates, setPageStates] = useState({});
    const [userInfo, setUserInfo] = useState<IUserInfo>({ userName:'', authenticated: false});
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