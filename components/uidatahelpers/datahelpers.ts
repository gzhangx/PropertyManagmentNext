import {
    getModel, sqlGet, sqlAdd, sqlDelete, ISqlRequestFieldDef,
    ISqlRequestWhereItem
} from '../api';
import { ISqlOrderDef, IGetModelReturn, IDBFieldDef, TableNames, ISqlDeleteResponse } from '../types'
import { get } from 'lodash';
export type FieldValueType = string | number | null;
const mod = {
    models: {} as {[key:string]:IGetModelReturn}
}

type IFieldType = (ISqlRequestFieldDef | string)[];
export type LoadMapperType = (what: string, fields: string[]) => IFieldType;
interface IOpts {
    whereArray: ISqlRequestWhereItem[];
    order: ISqlOrderDef[];
    rowCount: number;
    offset:number;
}


type IHelper = {
    getModelFields: () => IDBFieldDef[];
    loadModel: () => Promise<IGetModelReturn>;
    getOwnerSecFields: () => IDBFieldDef[];
    loadData: (loadMapper?: LoadMapperType, opts?: IOpts) => Promise<{
        total: number;
        rows: any[];
    }>;
    saveData: (data: any, id: FieldValueType) => Promise<any>;
    deleteData: (id: string) => Promise<ISqlDeleteResponse>;
}
export function createHelper(table: TableNames): IHelper {
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
        getOwnerSecFields: () => {
            return accModelFields().filter(f => f.foreignKey && f.foreignKey.table === 'userInfo');
        },
        loadData: async (loadMapper: LoadMapperType, opts = {} as IOpts) => {
            if (!loadMapper) loadMapper = (x, y) => y;
            //fields: array of field names
            const { whereArray, order, rowCount, offset } = opts;
            const modFields = accModelFields().map(f => f.field);
            const viewFields = get(accModel(), 'view.fields', []).map(f => f.name || f.field);
            return (await sqlGet({
                table,
                fields: loadMapper('fields', modFields.concat(viewFields)),
                joins: loadMapper('joins', null),
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
            return sqlAdd(table, submitData, !id);
        },
        deleteData: async id => sqlDelete(table, id),
    }
    return helper;
}

export async function createAndLoadHelper(table) {
    const helper = createHelper(table);
    await helper.loadModel();
    return helper;
}
