import {
    getModel, sqlGet, sqlAdd, sqlDelete, ISqlRequestFieldDef,
    ISqlRequestWhereItem
} from '../api';
import { ISqlOrderDef } from '../types'
import { get } from 'lodash';
const mod = {
    models: {} as {[key:string]:string}
}

type IFieldType = (ISqlRequestFieldDef | string)[];
type LoadMapperType = (what: string, fields: string[]) => IFieldType;
interface IOpts {
    whereArray: ISqlRequestWhereItem[];
    order: ISqlOrderDef[];
    rowCount: number;
    offset:number;
}
export function createHelper(table: string) {
    if (!table) return null;
    const accModel = () => mod.models[table];
    const accModelFields = () => get(accModel(), 'fields', []);
    return {
        getModelFields: accModelFields,
        loadModel: async () => {
            if (!accModel()) {
                mod.models[table] = await getModel(table);
            }
            return accModel();
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
        saveData: async (data, id) => {
            const submitData = accModelFields().reduce((acc, f) => {
                acc[f.field] = data[f.field];
                return acc;
            }, {});
            return sqlAdd(table, submitData, !id);
        },
        deleteData: async id => sqlDelete(table, id),
    }
}

export async function createAndLoadHelper(table) {
    const helper = createHelper(table);
    await helper.loadModel();
    return helper;
}
