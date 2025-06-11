import {
    IPageInfo,
    IStringDict,
    IPageDataDetails,
    ISheetRowData,
    IDbRowMatchData,
    IRowComparer,
    IPageStates,
    ICompRowData, getHouseByAddress,
    SheetIdFieldNames,
    IDbSaveData,
} from './types'
import {getHouseInfo, googleSheetRead,} from '../../api'
import {get, keyBy} from "lodash";
import * as lutil from "./loads/util";
import { stdFormatValue } from '../../uidatahelpers/datahelpers';
import { IPageRelatedState } from '../../reportTypes';


export async function loadPageSheetDataRaw(sheetId: string, pageState: IPageStates): Promise<IPageDataDetails> {
    const curPage: IPageInfo = pageState.curPage;
    if (!curPage) return null as any;
    let sheetIdField: SheetIdFieldNames = '';
    const allFields = pageState.curPage.allFields || [];
    {
        const allIdFields = allFields.filter(f => f.isId);
        const sheetIdFieldDef = allIdFields.find(f => !f.userSecurityField && f.isId);
        if (sheetIdFieldDef) {
            sheetIdField = sheetIdFieldDef.field as SheetIdFieldNames;
        }
    }
    return googleSheetRead(sheetId, 'read', `'${curPage.sheetMapping?.sheetName}'!${curPage.sheetMapping?.range}`).then((r) => {
        if (!r || !r.values || !r.values.length) {
            console.log(`no data for ${curPage.sheetMapping?.sheetName}`);
            return null;
        }

        // const specialFields: Map<string, (data: any) => void> = new Map();
        // allFields.forEach(f => {
        //     if (f.field === 'houseID' && f.foreignKey && f.foreignKey.table === 'houseInfo') {
        //         specialFields.set(f.field, (data) => {
        //             const houseInfo = getHouseByAddress(pageState, data[f.field])
        //             if (houseInfo) {
        //                 data['address'] = houseInfo.address;
        //                 data[f.field] = houseInfo.houseID;
        //             }
        //         });
        //     }
        // })        
        const dataRows: ISheetRowData[] = r.values.slice(1).map(rr => {
            const importSheetData = curPage.sheetMapping?.mapping.reduce((acc, f, ind) => {
                if (f) {
                    acc[f] = rr[ind];
                    //const specFunc = specialFields.get(f);
                    //if (specFunc) specFunc(acc);
                }
                return acc;
            }, {} as IStringDict);
            return {
                matchRes: 'NA',
                needUpdate: true,
                saveData: null,
                dataType: 'Sheet',
                invalid: '',
                matchToKey: '',
                matchedToId: '',
                needBackUpdateSheetWithId: '',
                importSheetData,
                matched: null,
                matcherName: '',
                displayData: {},
                sheetIdField,
            } as any as ISheetRowData;
        }).filter(x => x.importSheetData[curPage.sheetMustExistField as any]);
        if (sheetIdField) {
            const duplicateIds = new Map<string, number>();
            dataRows.forEach(r => {
                const id = ((r as any)[sheetIdField] || '').trim();
                if (id) {
                    duplicateIds.set(id, (duplicateIds.get(id) || 0) + 1);
                    const cnt: number = duplicateIds.get(id) as number;
                    if (cnt > 1) {
                        r.invalid = `duplicate id for ${sheetIdField} found for ${id} cnt=${cnt}`;
                    }
                }
            })
        }
        const ret: IPageDataDetails = {
            dataRows,
            sheetIdField,
        };
        return ret as any;
    }).catch(err => {
        console.log(err);
        throw err;
    });
}

//return true if not totally fixed
export function matchItems(pageDetails: IPageDataDetails, dbData: IDbSaveData[], cmp: IRowComparer): IDbRowMatchData[] {
    const sheetData: ISheetRowData[] = pageDetails.dataRows;
    const dbMatchData: IDbRowMatchData[] = dbData.map(dbItemData => {
        return {
            dbItemData,
            dataType: 'DB',
            matchedToKey: null,
        } as any as IDbRowMatchData;
    });
    pageDetails.dbMatchData = dbMatchData;
    const sheetIdField = pageDetails.sheetIdField;
    const dbIds: Map<string, IDbRowMatchData> = new Map();
    let debugItems: string[][] = [];
    const dbDataKeyedById: {[id:string]: IDbRowMatchData} = {};
    const dbDataKeyed = dbMatchData.reduce((acc, d) => {
        
        debugItems.push(cmp.getRowKeys(d.dbItemData, 'DB'));
        if (sheetIdField) {
            const id = d.dbItemData[sheetIdField] as string;
            if (id) {
                dbDataKeyedById[id] = d;
                dbIds.set(id, d);
            }
        }
        [true, false].forEach(makeIdNull => {
            const key = cmp.getRowKey(d.dbItemData, makeIdNull, 'DB');
            let cont = acc[key];
            if (!cont) {
                cont = [];
                acc[key] = cont;
            }
            cont.push(d);
        });
        return acc;
    }, {} as {
        [key: string]: IDbRowMatchData[];
    });

    sheetData.map(sd => {
        if (sd.matchToKey) return;
        
        const errors = cmp.getSheetInvalidValues(sd.importSheetData);
        if (errors) {
            sd.needUpdate = false;
            sd.sheetDataInvalidDontShowReason = errors;
            return;
        }

        const key = cmp.getRowKey(sd.importSheetData, false, 'Sheet');  //don't make id null, assume we have id
        if (key.indexOf('2024-08-01') >= 0) {
            console.log('debugremove key', key, Object.keys(dbDataKeyed).filter(k => k.indexOf('2024-08-01') >= 0));
        }
        const matchedAll = dbDataKeyed[key];

        if (sheetIdField) {
            const id = sd.importSheetData[sheetIdField] as SheetIdFieldNames;
            if (id) {
                //match id against db
                const matchedItemById = dbDataKeyedById[id]
                if (matchedItemById) {
                    sd.matchToKey = id;
                    sd.matchedToId = id;
                    sd.matched = matchedItemById.dbItemData;
                    sd.matcherName = cmp.name + '_byId';
                    matchedItemById.matchedToKey = id;
                    if (matchedAll && matchedAll.length) {
                        sd.needUpdate = false;        
                    }
                    return;
                }
            }
        }
        
        
        if (matchedAll && matchedAll.length) {
            const matched = matchedAll.find(m => !m.matchedToKey);
            if (matched) {
                sd.matchToKey = key;
                sd.matched = matched.dbItemData;
                sd.matcherName = cmp.name;
                sd.needUpdate = false;
                matched.matchedToKey = key;
                if (sheetIdField) {
                    sd.needBackUpdateSheetWithId = matched.dbItemData[sheetIdField] as string;
                }
            }
        } else {
            {
                const dkeys = cmp.getRowKeys(sd.importSheetData, 'Sheet');
                //debug starts
                let curFiltered = debugItems;
                for (let d = 0; d < dkeys.length; d++) {
                    const filtered = curFiltered.filter(di => {
                        if (di[d] === '2020-11-17') {
                            //console.log(`di cmp ${di[d]} ${dkeys[d]} equal=${di[d] === dkeys[d]}`)
                        }
                        const did = di[d];                        
                        if (did && did.match && did.match(/\d{4}-\d{2}-\d{2}/)) {
                            return did.substring(0, 10) === dkeys[d].substring(0, 10);
                        }
                        return di[d] === dkeys[d];
                    });
                    if (filtered.length === 0) break;
                    curFiltered = filtered;
                }
            }
            if (sheetIdField) {
                const id: string = sd.importSheetData[sheetIdField] as string;
                const matchedItemById = dbIds.get(id);
                if (matchedItemById) {
                    //sd.matchedById = sheetIdField;
                    sd.matchedToId = id;
                    sd.matched = matchedItemById.dbItemData;
                    matchedItemById.dbExtraNotDeleteButUpdate = sd;
                }
            }
        }
        return sd;
    });
    return dbMatchData;
}


function toResolvedForeignKeyIdName(fieldName: string) {
    return `${fieldName}_resolvedForeignKeyDesc`;
}

export function stdProcessSheetData(sheetData: ICompRowData[], pageState: IPageStates, mainCtx: IPageRelatedState, allowNullIds?: boolean): IStringDict[] {
    const allFields = pageState.curPage.allFields;
    const fieldNames = pageState.curPage.sheetMapping?.mapping.filter(f => f);
    const getDef = (name: string) => allFields?.find(f => f.field === name);
    return sheetData.map(sd => {        
        const acc = (sd as ISheetRowData).importSheetData || (sd as IDbRowMatchData).dbItemData;
        fieldNames?.forEach(fieldName => {
            let v = acc[fieldName];
            const def = getDef(fieldName);
            if (!def) {
                console.log(`Warning, can't find def for field ${pageState.curPage.table}.${fieldName} `)
                return;
            }
            if ((v === undefined || v === null || v === '') && def.required) {
                if (allowNullIds && def.isId) {
                    return;
                }
                sd.invalid = `${fieldName}::=>${v} stdProcessSheetData: Required field`;
                acc.invalidDesc = `${fieldName}::=>${v} stdProcessSheetData: Required field`;
                return;
            }
            switch (fieldName) {
                // case 'address':                                        
                //     const isHouse = def.foreignKey && def.foreignKey.field === 'houseID';
                //     if (!isHouse) {
                //         acc[fieldName] = v;
                //         break;
                //     }
                //     if (!v) {                        
                //         if (!acc['houseID']) {
                //             sd.invalid = 'house';
                //             acc.invalidDesc = 'house';
                //         } else {
                //             const house = pageState.housesById[acc['houseID']];
                //             if (house) {
                //                 acc[fieldName] = house.address;
                //             } else {
                //                 acc[fieldName] = `${v} Unable to match house`;
                //             }
                //         }
                //         break;
                //     }
                    
                //         const house = getHouseByAddress(pageState, v as string);
                //         if (house) {
                //             acc['houseID'] = house.houseID;
                //         } else {
                //             acc['houseID'] = null;
                //             //acc[fieldName] = `Invalid(${v})`;
                //             sd.invalid = 'house';
                //             acc.invalidDesc = 'house';
                //         }                    
                //     break;
                default:                
                    if (def.foreignKey && def.foreignKey.table && sd.dataType === 'Sheet') {
                        const fk = mainCtx.foreignKeyLoopkup.get(def.foreignKey.table);
                        if (v || v === 0) {
                            if (!fk) {
                                sd.invalid = fieldName;
                                //acc.invalidDesc = `${fieldName}::=>${v} Can't resolve foreign key`;
                                sd.invalid = `${fieldName}::=>${v} Can't resolve foreign key`;
                                console.log(acc.invalidDesc)
                            } else {
                                const resolved = fk.descToId.get(v as string);
                                if (!resolved) {
                                    if (def.allowBadForeignKey) {
                                        acc[fieldName] = v;
                                        const warn = `Allowed mismatch forenigh key warning${fieldName}::=>${v} Notable resolve foreign key for desc ${v}`;
                                        console.log(warn)
                                    } else {
                                        sd.invalid = fieldName;
                                        sd.invalid = `${fieldName}::=>${v} Can't resolve foreign key for desc ${v}`;
                                        console.log(sd.invalid)
                                    }
                                } else {
                                    acc[toResolvedForeignKeyIdName(fieldName)] = v;
                                    acc[fieldName] = resolved.id;
                                }
                            }
                        } else {
                            v = null as any;
                        }
                    } else {
                        switch (def.type) {
                            case 'date':
                            case 'datetime':
                            case 'decimal':
                                const fmted = stdFormatValue(def, v, fieldName);
                                if (fmted.error) {
                                    acc[fieldName] = fmted.error;
                                    sd.invalid = fieldName;
                                    sd.invalid = `${fieldName}::=>${v} ${fmted.error}`;
                                }
                                acc[fieldName] = fmted.v;
                                break;
                            default:
                                acc[fieldName] = v || '';
                        }
                    }
                    // if (def.type === 'decimal') {
                    //     if (v === null || v === undefined) {
                    //         acc[fieldName] = 'invalid(null)';
                    //         sd.invalid = fieldName;
                    //         acc.invalidDesc = `${fieldName} Invalid(null)`;
                    //     }
                    //     if (typeof v === 'string') {
                    //         v = v.replace(/[\$, ]/g, '').trim();
                    //         const neg = v.match(/\(([0-9]+(.[0-9]*){0,1}){1}\)/);
                    //         if (neg) {
                    //             v = '-' + neg[1];
                    //         }
                    //         v = parseFloat(v);
                    //     }
                    //     if (Number.isNaN(v) || !v) v = 0;
                    //     acc[fieldName] = v;
                    // } else if (def.type === 'date') {
                    //     const mt = moment(v);
                    //     if (!mt.isValid()) {
                    //         sd.invalid = fieldName;
                    //         acc.invalidDesc = `bad date ${fieldName}:${v}`;
                    //     } else {
                    //         const dateStr = mt.format('YYYY-MM-DD');
                    //         acc[fieldName] = dateStr;
                    //     }
                    // } else {
                    //     acc[fieldName] = v || '';
                    // }
                    break;                
            }
        });
        //const displayData = stdDisplayField(fieldNames, { ...acc }, pageState);
        //sd.displayData = displayData;
        //return displayData;
        //const displayData = stdDisplayField(fieldNames, { ...acc }, pageState);
        //sd.displayData = displayData;
        const obj = acc;
        sd.displayData = fieldNames?.reduce((acc, fieldName) => {
            let dsp = obj[fieldName];
            const fkdef = getDef(fieldName);
            if (fkdef?.foreignKey) {
                if (dsp) {
                    dsp = `${dsp}-${obj[toResolvedForeignKeyIdName(fieldName)]}`;
                } else {
                    dsp = '';
                }
            }
            (acc as any)[fieldName] = dsp;
            return acc;
        }, {});   
        return sd.displayData as any;
    });
}

export async function getHouseState() {
    const hi = await getHouseInfo();
    return {
        houses: hi,
        housesByAddress: keyBy(hi, h => lutil.getStdLowerName(h.address)),
        housesById: keyBy(hi, h => h.houseID),
    }
}
