import {
    getModel, sqlGet, sqlAdd, sqlDelete, 
    ISqlRequestWhereItem, updateSheet,
} from '../api';
import { ISqlOrderDef, IGetModelReturn, IDBFieldDef, TableNames, ISqlDeleteResponse } from '../types'
import { get } from 'lodash';
import { IFKDefs } from './GenCrudTableFkTrans';
import moment from 'moment';
import { IIncomeExpensesContextValue } from '../reportTypes';
export type FieldValueType = string | number | null;

import * as RootState from '../states/RootState'
import { ALLFieldNames } from '../page/imports2/types';

interface IOpts {
    whereArray: ISqlRequestWhereItem[];
    order: ISqlOrderDef[];
    rowCount: number;
    offset:number;
}

export type DataToDbSheetMapping ={
    sheetName: string;
    range: string;
    mapping: ALLFieldNames[];
    //endCol: string;
}

export type IHelper = {
    getModelFields: () => IDBFieldDef[];
    loadModel: () => Promise<IGetModelReturn>;
    loadData: (opts?: IOpts) => Promise<{
        total: number;
        rows: any[];
    }>;
    saveData: (data: any, id: FieldValueType, saveToSheet: boolean) => Promise<any>;
    deleteData: (ids: string[]) => Promise<ISqlDeleteResponse>;
}

export type IComplexDisplayFieldType = { field: string; name?: string;};
export type IDisplayFieldType = IComplexDisplayFieldType[];

export interface IHelperProps {
    table: TableNames;
    displayFields?: IDisplayFieldType;
    sheetMapping?: DataToDbSheetMapping;  //how googleSheet maps to db, used to save data to sheet
}
export interface IGenListProps extends IHelperProps { //copied from gencrud, need combine and refactor later
    //table: TableNames;
    //columnInfo: IColumnInfo[];    //auto populated
    //displayFields?: IDisplayFieldType;
    fkDefs?: IFKDefs;
    initialPageSize?: number;        
    /*
    paggingInfo: {
        total: number;
        PageSize: number;
        lastPage: number;
        pos: number;
    };
    setPaggingInfo: any;
    */
    title?: string;
    //doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; }>;

    //sheetMapping?: DataToDbSheetMapping;
}

export async function getTableModel(ctx: IIncomeExpensesContextValue, table: TableNames) :Promise<IDBFieldDef[]> {
    let mod = ctx.modelsProp.models[table];
    if (!mod) {
        mod = await getModel(table);
        ctx.modelsProp.models[table] = mod;
        ctx.modelsProp.setModels(old => {
            return {
                ...old,
                [table]: mod,
            }
        });
    }
    return mod.fields;
}

export function createHelper(rootCtx: RootState.IRootPageState, ctx: IIncomeExpensesContextValue, props: IHelperProps): IHelper {
    const googleSheetId: string = ctx.googleSheetAuthInfo.googleSheetId;
    //sheetMapping?: DataToDbSheetMapping
    const { table, sheetMapping } = props; 
    if (!table) return null;
    const accModel = () => ctx.modelsProp.models[table];
    const accModelFields = () => get(accModel(), 'fields', [] as IDBFieldDef[]);
    const innerState = {
        dateFields: [] as string[],
    }
    function formatFieldValue(fieldName: string, val: string) {
        if (!props.displayFields) return val;
        if (innerState.dateFields.includes(fieldName))
            return moment(val).format('YYYY-MM-DD');
        return val;        
        
        // if (!props.displayFields) return val;
        // const df = props.displayFields.find(f => (f as IComplexDisplayFieldType).field === fieldName) as IComplexDisplayFieldType;
        // if (!df) return val;
        // switch (df.type) {
        //     case 'date':
        //         return moment(val).format('YYYY-MM-DD');
        //         break;
        //     case 'number':
        //     default:
        //         return val;
        // }
    }
    const helper: IHelper = {
        getModelFields: accModelFields,
        loadModel: async () => {
            await getTableModel(ctx, table);
            const model = accModel();
            innerState.dateFields = model.fields.filter(f => f.type === 'date').map(f => f.field);
            return model;
        },        
        loadData: async (opts = {} as IOpts) => {
            //fields: array of field names
            const { whereArray, order, rowCount, offset } = opts;
            const modFields = accModelFields().map(f => f.field);
            const viewFields = get(accModel(), 'view.fields', []).map(f => f.name || f.field);
            const res = (await sqlGet({
                table,
                fields: modFields.concat(viewFields),
                joins: null,
                whereArray,
                order,
                rowCount, offset,
                groupByArray:null,
            })) as {
                total: number;
                rows: any[];
                };
            if ((res as any).error === 'not authorized') {
                rootCtx.setUserInfo(old => {                    
                    return {
                        ...old,
                        id: '',
                        token: ''
                    };
                })
            }
            return res;
        },
        saveData: async (data, id: string, saveToSheet: boolean) => {
            const submitData = accModelFields().reduce((acc, f) => {
                acc[f.field] = data[f.field];
                return acc;
            }, {});

            const sqlRes = await sqlAdd(table, submitData, !id);;
            if (!saveToSheet) return sqlRes;
            if (!googleSheetId) return sqlRes;

            const sheetMapper = (sheetMapping); //getTableNameToSheetMapping
            if (sheetMapper) {
                const values = sheetMapper.mapping.map(name => {
                    const val = data[name];
                    return formatFieldValue(name, val);
                })

                if (id) {
                    await updateSheet('update', googleSheetId, `'${sheetMapper.sheetName}'!A1`, [values]);
                } else {
                    await updateSheet('append', googleSheetId, `'${sheetMapper.sheetName}'!A1`, [values]);
                }
            }
            
            return sqlRes;
        },
        deleteData: async ids => sqlDelete(table, ids),
    }
    return helper;
}

function getTableNameToSheetMapping(sheetMapping?: DataToDbSheetMapping) {
    if (!sheetMapping) return null;
    //const charCodeA = 'A'.charCodeAt(0);
    //const colNames: string[] = [];
    //for (let i = 0; i < 25; i++) {
    //    colNames.push(String.fromCharCode(charCodeA + i));
    //}
    
    //sheetMapping.endCol = colNames[sheetMapping.mapping.length - 1];
    return sheetMapping;
}

export async function createAndLoadHelper(rootCtx: RootState.IRootPageState, ctx: IIncomeExpensesContextValue, props: IGenListProps) {
    const helper = createHelper(rootCtx, ctx, props);
    await helper.loadModel();
    return helper;
}
