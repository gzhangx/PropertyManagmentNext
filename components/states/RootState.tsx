import { createContext, SetStateAction, useContext, useState, Dispatch } from 'react';

interface IRootPageState {
    pageStates: { [key: string]: boolean };
    setPageStates: Dispatch<SetStateAction<{}>>;
}


const PageNavContext = createContext<IRootPageState>(null);

export function RootPageStateWrapper({ children }) {
    const [pageStates, setPageStates] = useState({});
    const defVal: IRootPageState = {
        pageStates,
        setPageStates,
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