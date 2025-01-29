import React, { useState, useEffect, useContext } from 'react';
import { getHouseInfo, getModel, getSheetAuthInfo, IGoogleSheetAuthInfo, sqlGet } from '../api';

import { IDBFieldDef, IPagePropsByTable, TableNames } from '../types'

import {    
    IForeignKeyCombo,
    IForeignKeyIdDesc,
    IForeignKeyLookupMap,
    IForeignKeyParsedRow,
    IModelsDict,
    IPageRelatedState,
    IWorkerInfo,
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


    const [foreignKeyLoopkup, setForeignKeyLookup] = useState<IForeignKeyLookupMap>(new Map());

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


    async function getTableModel(table: TableNames) :Promise<IDBFieldDef[]> {
        let mod = models.get(table);
        if (!mod) {
            mod = await getModel(table);
            models.set(table, mod);
            setModels(old => {
                return new Map([
                    ...old,
                    [table, mod],
                ]);
            });
        }
        return mod.fields;
    }

    async function loadForeignKeyLookup(table: TableNames, forceReload?: boolean): Promise<IForeignKeyCombo> {
        if (!forceReload) {
            const lookup = foreignKeyLoopkup.get(table);
            if (lookup) return lookup;
        }
        const fields = await getTableModel(table);

        const modFields = fields.map(f => f.field);
        const sqlRes = (await sqlGet({
            table,
            fields: modFields,
            joins: null,
            //whereArray,
            //order,
            //rowCount, offset,
            groupByArray: null,
        })) as {
            total: number;
            rows: any[];
            error?: string;
        };
        checkLoginExpired(rootCtx, sqlRes);
        const map: IForeignKeyIdDesc = new Map();
        const idField = fields.filter(f => f.isId && !f.userSecurityField)[0].field;
        const parser = {
            idGetter: a => a[idField],
            descGetter: a => a.desc,
        } as {
            idGetter: (obj: any) => string;
            descGetter: (obj: any) => string;
        }
        if (table === 'houseInfo') {
            parser.descGetter = obj => obj.address;
        } else if (table === 'workerInfo') {
            parser.descGetter = (obj: IWorkerInfo )=>obj.workerName
        }
        const rows: IForeignKeyParsedRow[] = sqlRes.rows.map(r => {
            return {
                ...r,
                id: parser.idGetter(r),
                desc: parser.descGetter(r),
            };
        })
        rows.forEach(r => {
            map.set(r.id, r);
        })
        const res: IForeignKeyCombo = {
            rows,
            idDesc: map,
        };
        foreignKeyLoopkup.set(table, res);
        setForeignKeyLookup(new Map(foreignKeyLoopkup));
        return res;
    }

    async function checkLoadForeignKeyForTable(table: TableNames): Promise<IDBFieldDef[]> {
        const fields = await getTableModel(table);
        for (const field of fields) {
            if (field.foreignKey && field.foreignKey.table) {
                await loadForeignKeyLookup(field.foreignKey.table);
            }
        }
        return fields;
    }

    function translateForeignLeuColumn(def: IDBFieldDef, data: any): string {
        const etb = def.foreignKey?.table;
        const val = data[def.field] as string; 
        if (!etb) {
            return val;
        }
        const lookup = foreignKeyLoopkup.get(etb);
        if (!lookup) {
            return val; //not loaded yet
        }
        return lookup.idDesc.get(val)?.desc || 'Failed Lookup: '+val;        
    }

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
        modelsProp: {
            models,
            getTableModel,
        },
        reloadCounter,
        //tableToHelperMap, setTableTohelperMap,
        foreignKeyLoopkup, loadForeignKeyLookup,
        checkLoadForeignKeyForTable,
        translateForeignLeuColumn,
        forceReload: () => setReloadCounter(v => v + 1),
    };
    return <PageRelatedContext.Provider value={pageCtx}>
        { props.children}
    </PageRelatedContext.Provider>;
}