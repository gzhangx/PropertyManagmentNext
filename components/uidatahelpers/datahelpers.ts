import {
    getModel, sqlGet, sqlAdd, sqlDelete, 
     updateSheet,
    googleSheetRead,
} from '../api';
import { IDBFieldDef, TableNames } from '../types'
import { get } from 'lodash';
import moment from 'moment';
import { IHelper, IHelperOpts, IPageRelatedState } from '../reportTypes';


import * as RootState from '../states/RootState'
import { tableNameToDefinitions } from './defs/allDefs';
import { ALLFieldNames, DataToDbSheetMapping, ITableAndSheetMappingInfo } from './datahelperTypes';
import { checkLoginExpired } from '../states/RootState';
import { ItemType } from './GenCrudAdd';







export interface IGenListProps extends ITableAndSheetMappingInfo { //copied from gencrud, need combine and refactor later
    //table: TableNames;
    //columnInfo: IColumnInfo[];    //auto populated
    //displayFields?: IDisplayFieldType;
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

export async function getTableModel(ctx: IPageRelatedState, table: TableNames) :Promise<IDBFieldDef[]> {
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

export function stdFormatValue(def: IDBFieldDef, v: string | number, fieldName?: string): { error?: string; v: string | number; } {
    if (def.type === 'decimal') {
        if (v === null || v === undefined || v === '') {
            //acc[fieldName] = 'invalid(null)';
            //sd.invalid = fieldName;
            //acc.invalidDesc = `${fieldName} Invalid(null)`;
            return {
                error: 'invalid(null)',
                v,
            }
        }
        if (typeof v === 'string') {
            v = v.replace(/[\$, ]/g, '').trim();
            const neg = v.match(/\(([0-9]+(.[0-9]*){0,1}){1}\)/);
            if (neg) {
                v = '-' + neg[1];
            }
            v = parseFloat(v);
        }
        if (Number.isNaN(v)) {
            return {
                error: `NAN=>${v}`,
                v,
            }
        }
        if (!v) v = 0;
        return {
            v,
        }
    }
    
    if (def.type === 'date' || def.type === 'datetime') {
        const mt = moment(v);
        if (!mt.isValid()) {
            //sd.invalid = fieldName;
            //acc.invalidDesc = `bad date ${fieldName}:${v}`;
            return {
                error: `bad date ${fieldName}:${v}`,
                v,
            }
        } else {
            const dateStr = mt.format('YYYY-MM-DD');
            //acc[fieldName] = dateStr;
            return {
                v: dateStr,
            }
        }
    }
    return {
        v,
    }
}
export function createHelper(rootCtx: RootState.IRootPageState, ctx: IPageRelatedState, props: ITableAndSheetMappingInfo): IHelper {
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
        loadData: async (opts = {} as IHelperOpts) => {
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
        saveData: async (data: ItemType, id: string, saveToSheet: boolean) => {
            const fieldTypeMapping: Map<string, IDBFieldDef> = new Map();
            const submitData = accModelFields().reduce((acc, f) => {
                acc[f.field] = data[f.field];                
                fieldTypeMapping.set(f.field, f);                
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
                    let val = data[name];
                    if (helperState.idField  === name) {
                        if (!val) {
                            val = newId;
                        }
                    }                    
                    return formatFieldValue(name, val as string);
                })

                if (id) {
                    const sheetData = await loadSheetData(googleSheetId, sheetMapper);                        
                    if (helperState.idField) {                            
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
                        const original = data._vdOriginalRecord;
                        let foundRow = -1;
                        function matchToLower(val: string, fieldName: string) {
                            if (!val) {
                                if (val === undefined) return '';
                                if (val === null) return '';
                                return val;
                            }
                            val = val.toString().trim();
                            const def = fieldTypeMapping.get(fieldName);
                            if (!def) return val;
                            return stdFormatValue(def, val, fieldName).v;
                        }
                        for (let row = 0; row < sheetData.values.length; row++) {
                            const rowData = sheetData.values[row];
                            let ok = true;
                            let pos = 0;
                            let debugKeepMatching = false;
                            for (const fielName of sheetMapper.mapping) {
                                if (!fielName) continue;
                                //console.log('matching row', row, fielName, 'rowData', rowData[pos], 'f=', matchToLower(rowData[pos], fielName), `data '${data[fielName]}'`, 'f=',matchToLower(data[fielName] as string, fielName))
                                if (matchToLower(rowData[pos], fielName) !== matchToLower(data[fielName] as string, fielName)) {
                                    ok = false;
                                    if (debugKeepMatching) {
                                        console.log('!! not matching row', row, fielName, 'rowData', rowData[pos], 'f=', matchToLower(rowData[pos], fielName), `data '${data[fielName]}'`, 'f=', matchToLower(data[fielName] as string, fielName))    
                                    }
                                    if (!debugKeepMatching)break;
                                } else {
                                    console.log('matched ', row, fielName, rowData[pos],'row=',row)
                                    console.log('matching row', row, fielName, 'rowData', rowData[pos], 'f=', matchToLower(rowData[pos], fielName), `data '${data[fielName]}'`, 'f=', matchToLower(data[fielName] as string, fielName))
                                    debugKeepMatching = true;
                                }
                                pos++;
                            }
                            if (ok) {
                                foundRow = row;
                                break;
                            }
                            console.log(`mathching row ${foundRow}`, row);
                        }
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

export async function createAndLoadHelper(rootCtx: RootState.IRootPageState, ctx: IPageRelatedState, props: IGenListProps) {
    const helper = createHelper(rootCtx, ctx, props);
    await helper.loadModel();
    return helper;
}


export function getGenListParms(ctx: IPageRelatedState, table: TableNames): ITableAndSheetMappingInfo {
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
