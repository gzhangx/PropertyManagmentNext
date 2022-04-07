
import { IPageInfo, IDataDetails,IItemData } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'

const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

export async function loadPageSheetDataRaw(curPage: IPageInfo): Promise<IDataDetails> {
    if (!curPage) return;
    
    return googleSheetRead(sheetId, 'read', `'${curPage.pageName}'!${curPage.range}`).then((r: {
        values: string[][];
    }) => {
        if (!r || !r.values.length) {
            console.log(`no data for ${curPage.pageName}`);
            return null;
        }
        if (curPage.fieldMap) {
            const columns = curPage.fieldMap.reduce((acc, f, ind) => {
                if (f) {
                    acc.push(r.values[0][ind]);
                }
                return acc;
            }, [] as string[]);
            const rows = r.values.slice(1).map(rr => {
                return curPage.fieldMap.reduce((acc, f, ind) => {
                    if (f) {
                        acc[f] = {
                            val: rr[ind],
                            obj: null,
                        };
                    }
                    return acc;
                }, {} as { [key: string]: IItemData; });
            }).filter(x => x[curPage.idField].val);
            return ({
                columns,
                rows,
            })
        } else {
            const columns = r.values[0];
            const rows = r.values.slice(1).map(r => {
                return r.reduce((acc, celVal, ind) => {
                    acc[ind] = {
                        val: celVal,
                        obj: null,
                    }
                    return acc;
                }, {} as { [key: string]: IItemData; });
            })
            return ({
                columns,
                rows,
            });
        }
    }).catch(err => {
        console.log(err);
        return null;
    });
}