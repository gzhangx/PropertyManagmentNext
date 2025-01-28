import React, { useState, useEffect, useContext } from 'react';
import { getHouseInfo, getSheetAuthInfo, IGoogleSheetAuthInfo } from '../api';

import { IPagePropsByTable } from '../types'

import {    
    IHouseInfo,
    IModelsDict,
    IPageRelatedState,
    TableNameToHelper,
} from '../reportTypes';
import { checkLoginExpired, useRootPageContext } from './RootState';

const PageRelatedContext = React.createContext({} as IPageRelatedState);

export function usePageRelatedContext() {
    return useContext(PageRelatedContext);
}
export function PageRelatedContextWrapper(props: {
    children: any
}) {
    const rootCtx = useRootPageContext();
    const [reloadCounter, setReloadCounter] = useState<number>(1);
    const [loginError, setLoginError] = useState<string>('');
    const [pageProps, setPageProps] = useState<IPagePropsByTable>({
        pagePropsTableInfo: {},
        reloadCount: 0,
    } as IPagePropsByTable);    
    
    const [googleSheetAuthInfo, setGoogleSheetAuthinfo] = useState<IGoogleSheetAuthInfo>({
        client_email: 'NA',
        googleSheetId: 'NA',
        private_key: '',
        private_key_id: '',
    } );

    //month selection states    

    const [models, setModels] = useState<IModelsDict>(new Map());   
    const [allHouses, setAllHouses] = useState<IHouseInfo[]>([]); //{houseID, address}
    
    
    const [tableToHelperMap, setTableTohelperMap] = useState<TableNameToHelper>(new Map());

    function reloadGoogleSheetAuthInfo() {
        return getSheetAuthInfo().then(auth => {
            if (auth.error) {
                checkLoginExpired(rootCtx, auth);
            } else {            
                setGoogleSheetAuthinfo(auth);
            }
            return auth;
        })
    }
    useEffect(() => {
        reloadGoogleSheetAuthInfo();
    }, [reloadCounter]);


    useEffect(() => {
        getHouseInfo().then(hs => setAllHouses(hs));
    }, [reloadCounter]);


    const pageCtx: IPageRelatedState = {
        //pageProps, setPageProps,
        pageState: {
            pageProps,
            setPageProps,
        },
        googleSheetAuthInfo,
        setGoogleSheetAuthinfo,
        reloadGoogleSheetAuthInfo,
        loginError,
        setLoginError,
        setAllHouses,
        allHouses,
        modelsProp: {
            models,
            setModels,
        },
        reloadCounter,
        forceReload: () => setReloadCounter(v => v + 1),
    };
    return <PageRelatedContext.Provider value={pageCtx}>
        { props.children}
    </PageRelatedContext.Provider>;
}