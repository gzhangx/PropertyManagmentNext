import {
    getModel, sqlGet, sqlAdd, sqlDelete, ISqlRequestFieldDef,
    ISqlRequestWhereItem, updateSheet,
} from '../api';
import { ISqlOrderDef, IGetModelReturn, IDBFieldDef, TableNames, ISqlDeleteResponse } from '../types'
import { get } from 'lodash';
import moment from 'moment';
export type FieldValueType = string | number | null;
const mod = {
    models: {} as {[key:string]:IGetModelReturn}
}

type IFieldType = (ISqlRequestFieldDef | string)[];
interface IOpts {
    whereArray: ISqlRequestWhereItem[];
    order: ISqlOrderDef[];
    rowCount: number;
    offset:number;
}

export type DataToDbSheetMapping ={
    sheetName: string;
    mapping: string[];
    formatter: (name: string) => ((v: string)=>string);
    endCol: string;
}

export type IHelper = {
    getModelFields: () => IDBFieldDef[];
    loadModel: () => Promise<IGetModelReturn>;
    loadData: (opts?: IOpts) => Promise<{
        total: number;
        rows: any[];
    }>;
    saveData: (data: any, id: FieldValueType) => Promise<any>;
    deleteData: (id: string) => Promise<ISqlDeleteResponse>;
}
export function createHelper(table: TableNames, googleSheetId: string, sheetMapping?: DataToDbSheetMapping): IHelper {
    if (!table) return null;
    const accModel = () => mod.models[table];
    const accModelFields = () => get(accModel(), 'fields', [] as IDBFieldDef[]);
    const helper: IHelper = {
        getModelFields: accModelFields,
        loadModel: async () => {
            if (!accModel()) {
                mod.models[table] = await getModel(table);
            }
            return accModel();
        },        
        loadData: async (opts = {} as IOpts) => {
            //fields: array of field names
            const { whereArray, order, rowCount, offset } = opts;
            const modFields = accModelFields().map(f => f.field);
            const viewFields = get(accModel(), 'view.fields', []).map(f => f.name || f.field);
            return (await sqlGet({
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
        },
        saveData: async (data, id: string) => {
            const submitData = accModelFields().reduce((acc, f) => {
                acc[f.field] = data[f.field];
                return acc;
            }, {});

            const sqlRes = await sqlAdd(table, submitData, !id);;
            if (!googleSheetId) return sqlRes;

            const sheetMapper = getTableNameToSheetMapping(table, sheetMapping);
            if (sheetMapper) {
                const values = sheetMapper.mapping.map(name => {
                    const val = data[name];
                    if (sheetMapper.formatter) {
                        return sheetMapper.formatter(name)(val);
                    }
                    return val;
                })

                if (id) {
                    await updateSheet('update', googleSheetId, `'${sheetMapper.sheetName}'!A1`, [values]);
                } else {
                    await updateSheet('append', googleSheetId, `'${sheetMapper.sheetName}'!A1`, [values]);
                }
            }
            
            return sqlRes;
        },
        deleteData: async id => sqlDelete(table, id),
    }
    return helper;
}

function getTableNameToSheetMapping(tableName: TableNames, sheetMapping?: DataToDbSheetMapping) {
    if (!sheetMapping) return null;
    const charCodeA = 'A'.charCodeAt(0);
    const colNames: string[] = [];
    for (let i = 0; i < 25; i++) {
        colNames.push(String.fromCharCode(charCodeA + i));
    }
    
    sheetMapping.endCol = colNames[sheetMapping.mapping.length - 1];
    return sheetMapping;
}

export async function createAndLoadHelper(table: TableNames, googleSheetId: string, sheetMapping?: DataToDbSheetMapping) {
    const helper = createHelper(table, googleSheetId, sheetMapping);
    await helper.loadModel();
    return helper;
}
