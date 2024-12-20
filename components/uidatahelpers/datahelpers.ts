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
export function createHelper(table: TableNames, googleSheetId: string): IHelper {
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

            const sqlRes = await sqlAdd(table, submitData, !id);;
            if (!googleSheetId) return sqlRes;

            const sheetMapper = getTableNameToSheetMapping(table);
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

function getTableNameToSheetMapping(tableName: TableNames) {
    const charCodeA = 'A'.charCodeAt(0);
    const colNames: string[] = [];
    for (let i = 0; i < 25; i++) {
        colNames.push(String.fromCharCode(charCodeA + i));
    }
    if (tableName === 'rentPaymentInfo') {
        const ret = {
            sheetName: 'testtest',
            mapping: [
                'receivedDate',
                'receivedAmount',
                'houseID_labelDesc',
                'paymentTypeName',
                'notes',
            ],
            formatter: (name: string) => {
                if (name === 'receivedDate') return (v:string) => moment(v).format('YYYY-MM-DD');
                if (name === 'receivedAmount') return (v: string) => parseFloat(v || '0').toFixed(2);
                return (v:string) => v;
            },
            endCol: 'B',
        };
        ret.endCol = colNames[ret.mapping.length - 1];
        return ret;
    }
    return null;
}

export async function createAndLoadHelper(table: TableNames, googleSheetId: string) {
    const helper = createHelper(table, googleSheetId);
    await helper.loadModel();
    return helper;
}
