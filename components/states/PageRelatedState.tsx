import React, { useState, useEffect, useContext, JSX } from 'react';
import { getModel, getSheetAuthInfo, IGoogleSheetAuthInfo, sqlGet } from '../api';

import { AllDateTypes, IDBFieldDef, IPagePropsByTable, TableNames } from '../types'

import {    
    IForeignKeyCombo,
    IForeignKeyLookupMap,
    ILeaseInfo,
    IModelsDict,
    IPageRelatedState,
    IWorkerInfo,
    TopBarIconNotifyCfg,
} from '../reportTypes';
import { checkLoginExpired, useRootPageContext } from './RootState';
import { NotifyIconItem } from '../page/tinyIconNotify';
import moment from 'moment';
import { IEditTextDropdownItem } from '../generic/GenericDropdown';
import { orderBy } from 'lodash';

import momentTimezone from 'moment-timezone';

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

    const [loadingDlgContent, setLoadingDlgContent] = useState<string | JSX.Element | null>(null);

    const [loadingDlgTitle, setLoadingDlgTitle] = useState<string>('Loading');

    const [foreignKeyLoopkup, setForeignKeyLookup] = useState<IForeignKeyLookupMap>(new Map());

    function generateTopBarNotifyOpt(): TopBarIconNotifyCfg {
        const [topBarMessages, setTopBarItems] = useState<NotifyIconItem[]>([]);
        const [show, setShow] = useState<boolean>(false);
        const cfg: TopBarIconNotifyCfg = {
            items: topBarMessages,
            setTopBarItems,
            show,
            setShow,
        }
        return cfg;
    }

    const topBarErrorsCfg = generateTopBarNotifyOpt();
    const topBarMessagesCfg = generateTopBarNotifyOpt();
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
    }, [reloadCounter, rootCtx.userInfo?.token]);


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
        const idField = fields.filter(f => f.isId && !f.userSecurityField)[0].field;
        const parser = {
            idGetter: a => a[idField],
            descGetter: a => a.desc,
        } as {
            idGetter: (obj: any) => string;
            descGetter: (obj: any) => string;
            }
        
        const res: IForeignKeyCombo = {
            rows: [],
            idDesc: new Map(),
            descToId: new Map(),
        };
        switch (table) {
            case 'houseInfo':
                parser.descGetter = obj => obj.address;
                break;
            case 'workerInfo':
                parser.descGetter = (obj: IWorkerInfo) => obj.workerName
                break;
            case 'tenantInfo':
                parser.descGetter = (obj) => obj.fullName;
                break;
            case 'leaseInfo':
                parser.descGetter = (obj: ILeaseInfo) => obj.houseID+'-'+obj.startDate.substring(0,10) + '-' + obj.endDate.substring(0,10)+'-'+obj.leaseID;
                res.specialOptionGenerator = (row) => {                     
                    const leases = orderBy((res.rows as (ILeaseInfo & { id: string; desc: string; })[]).filter(r=>r.houseID === row.houseID), l=>l.startDate, 'desc');
                    
                    return leases.map(l => {
                        const rr: IEditTextDropdownItem = {
                            label: l.desc,
                            value: l.id,
                        };
                        return rr;
                    })
                };
                break;
            default:
                console.log(`Error, id desc sorter not set for ${table}`);
        }
        
        res.rows = sqlRes.rows.map(r => {
            return {
                ...r,
                id: parser.idGetter(r),
                desc: parser.descGetter(r),
            };
        })
        //const map: IForeignKeyIdDesc = new Map();
        //const descToId: IForeignKeyIdDesc = new Map();
        res.rows.forEach(r => {
            res.idDesc.set(r.id, r);
            res.descToId.set(r.desc, r);
        })
        //const res: IForeignKeyCombo = {
        //    rows,
        //    idDesc: map,
        //    descToId,
        //};
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
        return lookup.idDesc.get(val)?.desc || `Failed Lookup tbl=(${etb})-field=${def.field}: `+val;        
    }


    //const curBrowserTimeZone = new Date().getTimezoneOffset() / 60;
    //const browserTouserZoneToUtcDeduction = - (rootCtx.userInfo.timezone || 0) - curBrowserTimeZone;
    //console.log('browserTouserZoneToUtcDeduction', browserTouserZoneToUtcDeduction);
    const FULLYYYYMMDDHHMMSSFormat = 'YYYY-MM-DD HH:mm:ss';
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
            getTableModelSync: table => {                
                const mod = models.get(table);
                if (!mod) return [];
                return mod.fields;
            }
        },
        reloadCounter,
        //tableToHelperMap, setTableTohelperMap,
        foreignKeyLoopkup, loadForeignKeyLookup,
        checkLoadForeignKeyForTable,
        translateForeignLeuColumn,
        forceReload: () => setReloadCounter(v => v + 1),
        topBarErrorsCfg,
        topBarMessagesCfg,
        timezone: rootCtx.userInfo.timezone,
        browserTimeToUTCDBTime: (bt: AllDateTypes) => {            
            if (typeof bt === 'string') {
                return momentTimezone.tz(bt, rootCtx.userInfo.timezone).utc().format(FULLYYYYMMDDHHMMSSFormat)
            }
            if (bt instanceof Date) {
                return bt.toISOString().substring(0, 19);
            }            
            return bt.utc().format(FULLYYYYMMDDHHMMSSFormat);
        },
        utcDbTimeToZonedTime: (utc: AllDateTypes, format?: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss') => {
            try {               
                return momentTimezone.tz(utc, rootCtx.userInfo.timezone).format(format || FULLYYYYMMDDHHMMSSFormat);
                //return moment.utc(utc).utcOffset(rootCtx.userInfo.timezone).format(format || FULLYYYYMMDDHHMMSSFormat);
            } catch (err) {
                console.log(err, moment.utc(utc).utcOffset(rootCtx.userInfo.timezone));
                return utc.toString();
            }
        },

        loadingDlgContent,
        loadingDlgTitle,
        showLoadingDlg: (cnt, title) => {
            setLoadingDlgContent(cnt);
            if (title !== loadingDlgTitle && title !== undefined) setLoadingDlgTitle(title);
        }
    };
    return <PageRelatedContext.Provider value={pageCtx}>
        { props.children}
    </PageRelatedContext.Provider>;
}