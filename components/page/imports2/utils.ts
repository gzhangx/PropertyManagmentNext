import {
    IPageInfo, IStringDict, IPageDataDetails, ISheetRowData, IDbRowMatchData, IRowComparer,} from './types'
import { googleSheetRead,  } from '../../api'


export async function loadPageSheetDataRaw(sheetId: string, curPage: IPageInfo): Promise<IPageDataDetails> {
    if (!curPage) return;

    return googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r) => {
        if (!r || !r.values || !r.values.length) {
            console.log(`no data for ${curPage.pageName}`);
            return null;
        }

        const colNames: IStringDict = curPage.fieldMap.reduce((acc, f, ind) => {
            if (f) {
                acc[f] = r.values[0][ind];
            }
            return acc;
        }, {});
        const dataRows: ISheetRowData[] = r.values.slice(1).map(rr => {
            const importSheetData = curPage.fieldMap.reduce((acc, f, ind) => {
                if (f) {
                    acc[f] = rr[ind];
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
            } as ISheetRowData;
        }).filter(x => x.importSheetData[curPage.sheetMustExistField]);
        return {
            colNames,
            dataRows,
        } as IPageDataDetails;
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
