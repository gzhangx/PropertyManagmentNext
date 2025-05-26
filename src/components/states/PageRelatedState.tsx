'use client'
import React, { useState, useEffect, useContext, JSX } from 'react';
import { getModel, getSheetAuthInfo, sqlGet } from '../api';

import { AllDateTypes, IDBFieldDef, IGetModelReturn, IPagePropsByTable, TableNames } from '../types'

import {    
    IForeignKeyCombo,
    IForeignKeyLookupMap,
    IGoogleSheetAuthInfo,
    ILeaseInfo,
    IModelsDict,
    IPageRelatedState,
    IWorkerInfo,
    TaxExpenseCategories,
    TaxExpenseCategoryDataType,
    TaxExpenseCategoryNameType,
    TopBarIconNotifyCfg,
} from '../reportTypes';
import { useRootPageContext } from './RootState';
import { NotifyIconItem } from '../page/tinyIconNotify';
import moment from 'moment';
import { IEditTextDropdownItem } from '../generic/GenericDropdown';
import { orderBy } from 'lodash';

import momentTimezone from 'moment-timezone';
import { ALLFieldNames, ItemType, ItemTypeDict } from '../uidatahelpers/datahelperTypes';

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
            if (!auth) return null as any as IGoogleSheetAuthInfo; //not setup yet
            if (auth.error) {
                rootCtx.checkLoginExpired(auth);
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
        let mod = models.get(table) as IGetModelReturn;
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
            groupByArray: undefined,
        })) as {
            total: number;
            rows: any[];
            error?: string;
        };
        if (rootCtx.checkLoginExpired(sqlRes)) {
            console.log('Login expired, reload page');
            return null as unknown as IForeignKeyCombo;
        }
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
            idObj: new Map(),
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
                res.specialOptionGenerator = (row) => {
                    const allOps = res.rows.map(r => {
                        return {
                            label: r.desc,
                            value: r.id,
                            selected: false,
                        }
                    });
                    return [{ label: '', value: '', }].concat(allOps);
                };
                break;
            case 'leaseInfo':
                parser.descGetter = (obj: ILeaseInfo) => obj.houseID+'-'+obj.startDate?.substring(0,10) + '-' + obj.endDate?.substring(0,10)+'-'+obj.leaseID;
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
            case 'expenseCategories':
                parser.descGetter = obj => obj.expenseCategoryName;
                break;
            case 'paymentType':
                parser.descGetter = obj => obj.paymentTypeName;
                break;
            default:
                console.log(`Error, id desc sorter not set for ${table}`);
        }
        
        res.rows = sqlRes.rows.map(r => {
            const id = parser.idGetter(r);
            res.idObj.set(id, r);
            return {
                ...r,
                id,
                desc: parser.descGetter(r),
            };
        })

        switch (table) {
            case 'expenseCategories':
                //use irs tax categories, and use irs ID, use desc from table if matches id
                const expenseCatDbRows = (sqlRes.rows as TaxExpenseCategoryDataType[]);
                res.rows = TaxExpenseCategories.map(catName => {
                    const cat = {
                        id: catName,
                        desc: catName,
                    };
                    return cat;
                });
                expenseCatDbRows.forEach(dbData => {
                    if (!TaxExpenseCategories.includes(dbData.expenseCategoryID as TaxExpenseCategoryNameType)) {
                        //no matching dbData, 
                        res.rows.push({
                            id: dbData.expenseCategoryID,
                            desc: dbData.expenseCategoryName,
                        });                     
                    } 
                    // else means we have matchind id in DB, this is taken care of
                });
                break;
        }
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

    function translateForeignLeuColumnToObject(def: IDBFieldDef, data: ItemType): ItemType | string {
        const etb = def.foreignKey?.table;
        const val = data.data[def.field as ALLFieldNames] as string;
        if (!etb) {
            return val;
        }
        const lookup = foreignKeyLoopkup.get(etb);
        if (!lookup) {
            return val; //not loaded yet
        }
        return { data: lookup.idObj.get(val) as ItemTypeDict };
    }

    function getAllForeignKeyLookupItems(table: TableNames): ItemType[] | null {
        const all = foreignKeyLoopkup.get(table);
        if (!all) return null;
        return Array.from(all.idObj.values().map(data=>({data})));
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
        translateForeignLeuColumnToObject,
        getAllForeignKeyLookupItems,
        forceReload: () => setReloadCounter(v => v + 1),
        topBarErrorsCfg,
        topBarMessagesCfg,
        timezone: rootCtx.userInfo.timezone,
        browserTimeToUTCDBTime: (bt: AllDateTypes | null | undefined) => {            
            if (bt == null) return null;
            if (typeof bt === 'string') {
                return momentTimezone.tz(bt, rootCtx.userInfo.timezone).utc().format(FULLYYYYMMDDHHMMSSFormat)
            }
            if (bt instanceof Date) {
                return bt.toISOString().substring(0, 19);
            }            
            return bt.utc().format(FULLYYYYMMDDHHMMSSFormat);
        },
        utcDbTimeToZonedTime: (utc: AllDateTypes | null | undefined, format?: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm:ss') => {
            if (utc == null) return null;
            try {               
                //console.log('from utc', utc, ' to ', rootCtx.userInfo.timezone, momentTimezone.tz(moment.utc(utc), rootCtx.userInfo.timezone).format(format || FULLYYYYMMDDHHMMSSFormat))
                return momentTimezone.tz(moment.utc(utc), rootCtx.userInfo.timezone).format(format || FULLYYYYMMDDHHMMSSFormat);
                //return moment.utc(utc).utcOffset(rootCtx.userInfo.timezone).format(format || FULLYYYYMMDDHHMMSSFormat);
            } catch (err) {
                console.log(err);
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