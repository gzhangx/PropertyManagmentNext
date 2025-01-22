import {
    getModel, sqlGet, sqlAdd, sqlDelete, 
    ISqlRequestWhereItem, updateSheet,
    googleSheetRead,
} from '../api';
import { ISqlOrderDef, IGetModelReturn, IDBFieldDef, TableNames, ISqlDeleteResponse } from '../types'
import { get } from 'lodash';
import { IFKDefs } from './GenCrudTableFkTrans';
import moment from 'moment';
import { IIncomeExpensesContextValue } from '../reportTypes';
export type FieldValueType = string | number | null;

import * as RootState from '../states/RootState'
import { tableNameToDefinitions } from './defs/allDefs';
import { ALLFieldNames, DataToDbSheetMapping, ITableAndSheetMappingInfo } from './datahelperTypes';
import { checkLoginExpired } from '../states/RootState';

interface IOpts {
    whereArray: ISqlRequestWhereItem[];
    order: ISqlOrderDef[];
    rowCount: number;
    offset:number;
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



export interface IGenListProps extends ITableAndSheetMappingInfo { //copied from gencrud, need combine and refactor later
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
    let mod = ctx.modelsProp.models.get(table);
    if (!mod) {
        mod = await getModel(table);
        ctx.modelsProp.models.set(table, mod);
        ctx.modelsProp.setModels(old => {
            return new Map([
                ...old,
                [table, mod],
            ]);
        });
    }
    return mod.fields;
}

export function createHelper(rootCtx: RootState.IRootPageState, ctx: IIncomeExpensesContextValue, props: ITableAndSheetMappingInfo): IHelper {
    const googleSheetId: string = ctx.googleSheetAuthInfo.googleSheetId;
    //sheetMapping?: DataToDbSheetMapping
    const { table, sheetMapping } = props; 
    if (!table) return null;
    const accModel = () => ctx.modelsProp.models.get(table);
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
    const helperState = {
        idField: '' as ALLFieldNames,
        sheetIdPos: -1,
    };
    const helper: IHelper = {
        getModelFields: accModelFields,
        loadModel: async () => {
            await getTableModel(ctx, table);
            const model = accModel();
            innerState.dateFields = model.fields.filter(f => f.type === 'date').map(f => f.field);
            accModelFields().forEach(f => {                
                if (f.isId && !f.userSecurityField) {
                    helperState.idField = f.field as ALLFieldNames;
                    helperState.sheetIdPos = sheetMapping.mapping.indexOf(helperState.idField);
                }
            });
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
                error?: string;
                };
            checkLoginExpired(rootCtx, res);
            return res;
        },
        saveData: async (data: any, id: string, saveToSheet: boolean) => {
            const submitData = accModelFields().reduce((acc, f) => {
                acc[f.field] = data[f.field];
                return acc;
            }, {});

            const sqlRes = await sqlAdd(table, submitData, !id);;
            if (!saveToSheet) return sqlRes;
            if (!googleSheetId || googleSheetId === 'NA') return sqlRes;
            const newId = sqlRes.id;
            if (!id && !newId) {
                return sqlRes;
            }

            const sheetMapper = (sheetMapping); //getTableNameToSheetMapping
            if (sheetMapper) {
                const values = sheetMapper.mapping.map(name => {
                    let val: string = data[name];
                    if (helperState.idField  === name) {
                        if (!val) {
                            val = newId;
                        }
                    }                    
                    return formatFieldValue(name, val);
                })

                if (id) {
                    if (helperState.idField) {
                        const sheetData = await loadSheetData(googleSheetId, sheetMapper);                        
                        if (helperState.sheetIdPos >= 0) {
                            let foundRow = -1;
                            for (let row = 0; row < sheetData.values.length; row++) {
                                if (sheetData.values[row][helperState.sheetIdPos] === id) {
                                    foundRow = row;
                                    break;
                                }
                            }
                            console.log(`sheetData printout idPos=${helperState.sheetIdPos} found=${foundRow} newId=${newId} id=${id}`, foundRow, sheetData, sqlRes)
                            if (foundRow >= 0) {
                                await updateSheet('update', googleSheetId, sheetMapper.sheetName, {
                                    row: foundRow,
                                    values: [values]
                                });
                            }
                        }
                    } else {
                        //no sheet id, must match against old data
                    }
                } else {
                    //`'${sheetMapper.sheetName}'!A1`
                    await updateSheet('append', googleSheetId, sheetMapper.sheetName, {
                        row: 0,
                        values: [values]
                    });
                }
            }
            
            return sqlRes;
        },
        deleteData: async ids => sqlDelete(table, ids),
    }
    return helper;
}

async function loadSheetData(sheetId: string, sheetMapper: DataToDbSheetMapping) {
    const res = await googleSheetRead(sheetId, 'read', `'${sheetMapper.sheetName}'!${sheetMapper.range}`);
    return res;
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


export function getGenListParms(ctx: IIncomeExpensesContextValue, table: TableNames): ITableAndSheetMappingInfo {
    const def = tableNameToDefinitions.get(table);
    const allFields = ctx.modelsProp.models.get(table).fields;
    return {
        table,
        allFields,
        displayFields: allFields.map(f => {
            if (f.foreignKey && f.foreignKey.field === 'houseID') {
                return {
                    ...f,
                    field: 'address',
                    name: 'House',                    
                }
            }
            if (f.isId) return null;
            return f;
        }).filter(x=>x),
        sheetMapping: def.sheetMapping,
    };
}
