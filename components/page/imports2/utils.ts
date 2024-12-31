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
} from './types'
import {getHouseInfo, googleSheetRead,} from '../../api'
import moment from "moment/moment";
import {get, keyBy} from "lodash";
import * as lutil from "./loads/util";
import { ALLFieldNames } from '../../uidatahelpers/datahelperTypes';


export async function loadPageSheetDataRaw(sheetId: string, pageState: IPageStates): Promise<IPageDataDetails> {
    const curPage: IPageInfo = pageState.curPage;
    if (!curPage) return;
    let sheetIdField: SheetIdFieldNames = '';
    const allFields = pageState.curPage.allFields || [];
    {
        const allIdFields = allFields.filter(f => f.isId);
        const sheetIdFieldDef = allIdFields.find(f => !f.userSecurityField && f.foreignKey);
        if (sheetIdFieldDef) {
            sheetIdField = sheetIdFieldDef.field as SheetIdFieldNames;
        }
    }
    return googleSheetRead(sheetId, 'read', `'${curPage.sheetMapping.sheetName}'!${curPage.sheetMapping.range}`).then((r) => {
        if (!r || !r.values || !r.values.length) {
            console.log(`no data for ${curPage.sheetMapping.sheetName}`);
            return null;
        }

        const specialFields: Map<string, (data: any) => void> = new Map();
        allFields.forEach(f => {
            if (f.field === 'houseID' && f.foreignKey && f.foreignKey.table === 'houseInfo') {
                specialFields.set(f.field, (data) => {
                    const houseInfo = getHouseByAddress(pageState, data[f.field])
                    if (houseInfo) {
                        data['address'] = houseInfo.address;
                        data[f.field] = houseInfo.houseID;
                    }
                });
            }
        })        
        const dataRows: ISheetRowData[] = r.values.slice(1).map(rr => {
            let matchedById = '';
            const importSheetData = curPage.sheetMapping.mapping.reduce((acc, f, ind) => {
                if (f) {
                    acc[f] = rr[ind];
                    const specFunc = specialFields.get(f);
                    if (specFunc) specFunc(acc);
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
                importSheetData,
                matched: null,
                matcherName: '',
                displayData: {},
                sheetIdField,
                matchedById,
            } as ISheetRowData;
        }).filter(x => x.importSheetData[curPage.sheetMustExistField]);
        if (sheetIdField) {
            const duplicateIds = new Map<string, number>();
            dataRows.forEach(r => {
                const id = (r[sheetIdField] || '').trim();
                if (id) {
                    duplicateIds.set(id, (duplicateIds.get(id) || 0) + 1);
                    const cnt = duplicateIds.get(id);
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
        return ret;
    }).catch(err => {
        console.log(err);
        throw err;
    });
}

//return true if not totally fixed
export function matchItems(sheetData: ISheetRowData[], dbMatchData: IDbRowMatchData[], cmp: IRowComparer): boolean {
    const dbDataKeyed = dbMatchData.reduce((acc, d) => {
        const key = cmp.getRowKey(d.dbItemData, 'DB');
        let cont = acc[key];
        if (!cont) {
            cont = [];
            acc[key] = cont;
        }
        cont.push(d);
        return acc;
    }, {} as {
        [key: string]: IDbRowMatchData[];
    });

    sheetData.map(sd => {
        if (sd.matchToKey) return;
        const key = cmp.getRowKey(sd.importSheetData, 'Sheet');
        const matchedAll = dbDataKeyed[key];
        if (matchedAll && matchedAll.length) {
            const matched = matchedAll.find(m => !m.matchedToKey);
            if (matched) {
                sd.matchToKey = key;
                sd.matched = matched.dbItemData;
                sd.matcherName = cmp.name;
                sd.needUpdate = false;
                matched.matchedToKey = key;
            }
        }
        return sd;
    });
    return !!sheetData.find(d => !d.matched);
}


function stdDisplayField(fieldNames: ALLFieldNames[], obj: IStringDict, pageState: IPageStates) : IStringDict {
    return fieldNames.reduce((acc, fieldName) => {
        let dsp = obj[fieldName];
        if (dsp === 0) {
            acc[fieldName] = dsp;
            return acc;
        }
        if (dsp === null || dsp === undefined) {
            acc[fieldName] = '';
            return acc;
        }
        if (!dsp && dsp !== '') return acc;
        const fieldDef = pageState.curPage.allFields.find(f => f.field === fieldName);
        switch (fieldDef.type) {
            case 'date':            
                const mmt = moment(dsp);
                if (mmt.isValid())
                    dsp = mmt.format('YYYY-MM-DD');
                else
                    dsp = `Invalid(${dsp})`;
                break;
            case 'decimal':            
                if (typeof dsp === 'number') dsp = dsp.toFixed(2);
                else dsp = parseFloat(dsp || '0').toFixed(2);
                break;            
        }
        acc[fieldName] = dsp;
        return acc;
    }, {});
}


export function stdProcessSheetData(sheetData: ICompRowData[], pageState: IPageStates): IStringDict[] {
    const allFields = pageState.curPage.allFields;
    const fieldNames = pageState.curPage.sheetMapping.mapping.filter(f => f);
    const getDef = (name: string) => allFields.find(f => f.field === name);
    return sheetData.map(sd => {
        const acc = (sd as ISheetRowData).importSheetData || (sd as IDbRowMatchData).dbItemData;
        fieldNames.forEach(fieldName => {
            let v = acc[fieldName];
            const def = getDef(fieldName);
            if (!def) {
                console.log(`Warning, can't find def for field ${pageState.curPage.table}.${fieldName} `)
                return;
            }
            switch (fieldName) {
                case 'address':                                        
                    const isHouse = def.foreignKey && def.foreignKey.field === 'houseID';
                    if (!isHouse) {
                        acc[fieldName] = v;
                        break;
                    }
                    if (!v) {                        
                        if (!acc['houseID']) {
                            sd.invalid = 'house';
                            acc.invalidDesc = 'house';
                        } else {
                            const house = pageState.housesById[acc['houseID']];
                            if (house) {
                                acc[fieldName] = house.address;
                            } else {
                                acc[fieldName] = `${v} Unable to match house`;
                            }
                        }
                        break;
                    }
                    
                        const house = getHouseByAddress(pageState, v as string);
                        if (house) {
                            acc['houseID'] = house.houseID;
                        } else {
                            acc['houseID'] = null;
                            //acc[fieldName] = `Invalid(${v})`;
                            sd.invalid = 'house';
                            acc.invalidDesc = 'house';
                        }                    
                    break;
                default:                
                    if (def.type === 'decimal') {
                        if (v === null || v === undefined) {
                            acc[fieldName] = 'invalid(null)';
                            sd.invalid = fieldName;
                            acc.invalidDesc = `${fieldName} Invalid(null)`;
                        }
                        if (typeof v === 'string') {
                            v = v.replace(/[\$, ]/g, '').trim();
                            const neg = v.match(/\(([0-9]+(.[0-9]*){0,1}){1}\)/);
                            if (neg) {
                                v = '-' + neg[1];
                            }
                            v = parseFloat(v);
                        }
                        if (Number.isNaN(v) || !v) v = 0;
                        acc[fieldName] = v;
                    } else if (def.type === 'date') {
                        const mt = moment(v);
                        if (!mt.isValid()) {
                            sd.invalid = fieldName;
                            acc.invalidDesc = `bad date ${fieldName}:${v}`;
                        } else {
                            const dateStr = mt.format('YYYY-MM-DD');
                            acc[fieldName] = dateStr;
                        }
                    } else {
                        acc[fieldName] = v || '';
                    }
                    break;                
            }
        });
        const displayData = stdDisplayField(fieldNames, { ...acc }, pageState);
        sd.displayData = displayData;
        return displayData;
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
