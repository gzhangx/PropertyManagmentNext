
import { IPageInfo, IStringDict, ICompRowData, IPageStates, IPageParms, IPageDataDetails, IDbSaveData, ISheetRowData, IDbRowMatchData, IRowComparer } from './types'
import { googleSheetRead, getOwners, sqlAdd, getHouseInfo, getPaymentRecords } from '../../api'
import { keyBy } from 'lodash'
import moment from 'moment';
import { ALLFieldNames, getHouseByAddress } from '../imports2/types';
//const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';

async function loadPageSheetDataRaw(sheetId: string, curPage: IPageInfo): Promise<IPageDataDetails> {
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
        }).filter(x => x[curPage.idField]);
        return {
            colNames,
            dataRows,
        } as IPageDataDetails;   
    }).catch(err => {
        console.log(err);
        throw err;
    });
}


export async function createPayment(params: IPageParms, curPageState: IPageStates, rowInd: number, reloadPayments: boolean) {    
    const state = curPageState;
    const dispatchCurPageState = params.dispatchCurPageState;
    const changeRow = state.pageDetails.dataRows[rowInd] as ISheetRowData;
    const saveData = changeRow.saveData;
    changeRow.needUpdate = true;
    if (changeRow.invalid) {
        console.log(`invalid payment, don't create ${changeRow.invalid}`);
        return;
    }
    sqlAdd('rentPaymentInfo',
        saveData, true
    ).then(res => {
        console.log('sql add owner');
        console.log(res)
    }).catch(err => {
        console.log('sql add owner err');
        console.log(err)
        params.setErrorStr(`sql add rentpayment error ${err.message}`);
    })
    dispatchCurPageState(state => {
        return {
            ...state,
            stateReloaded: ++state.stateReloaded,
            reloadPayments,
            pageDetails: {
                ...state.pageDetails,
            }
        }
    })
}


export async function getHouseState() {
    const hi = await getHouseInfo();
    return {
        houses: hi,
        housesByAddress: keyBy(hi, h => h.address.toLowerCase()),
    }
}

export async function genericPageLoader(prms: IPageParms, sheetId: string, pageState: IPageStates) {
    const page = pageState.curPage;
    const pageDetails = await loadPageSheetDataRaw(sheetId, page);
    let hi = {};
    if (!pageState.houses) {
        //const hi = await getHouseInfo();
        hi = await getHouseState();
    }
    let dbData: IDbSaveData[] = [];
    if (page.dbLoader) {
        dbData = await page.dbLoader(pageState.selectedOwners);
    }    

    const sheetDatas = pageDetails.dataRows as ISheetRowData[];
    const displayData = stdProcessSheetData(sheetDatas, pageState);

    if (page.rowComparers) {
        page.rowComparers.forEach(cmp => matchItems(sheetDatas, dbData, cmp));
    }
    prms.dispatchCurPageState(state => {
        return {
            ...state,
            pageDetails,
            //houses: hi,
            //housesByAddress: keyBy(hi, 'address'),
            ...hi,
        }
    });
}

//return true if not totally fixed
function matchItems(sheetData: ISheetRowData[], dbData: IDbSaveData[], cmp: IRowComparer): boolean {
    const dbMatchData = dbData.map(dbItemData => {
        return {
            dbItemData,
            dataType: 'DB',
            matchedToKey: null,
        } as IDbRowMatchData;
    })
    const dbDataKeyed = dbMatchData.reduce((acc, d) => {
        const key = cmp.getRowKey(d.dbItemData);
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
        const key = cmp.getRowKey(sd.importSheetData);
        const matchedAll = dbDataKeyed[key];
        if (matchedAll && matchedAll.length) {
            const matched = matchedAll.find(m => !m.matchedToKey);
            if (matched) {
                sd.matchToKey = key;
                sd.matched = matched.dbItemData;
                sd.matcherName = cmp.name;
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
        if (!dsp && dsp !== '') return;
        switch (fieldName) {
            case 'date':
            case 'receivedDate':
            case 'startDate':
                dsp = moment(dsp).format('YYYY-MM-DD');
                break;
            case 'monthlyRent':
            case 'deposit':
            case 'receivedAmount':
            case 'petDeposit':
                if (typeof dsp === 'number') return dsp.toFixed(2);
                dsp = parseFloat(dsp || '0').toFixed(2);
                break;
            case 'houseID':
                break;
            case 'ownerName':
                break;
        }
        acc[fieldName] = dsp;
        return acc;
    }, {});
}


function stdProcessSheetData(sheetData: ISheetRowData[], pageState: IPageStates) : IStringDict[] {
    const fieldNames = pageState.curPage.fieldMap.filter(f => f);
    return sheetData.map(sd => {
        const acc = sd.importSheetData;
        fieldNames.forEach(fieldName => {            
            let v = acc[fieldName];
            switch (fieldName) {
                case 'address':
                    const house = getHouseByAddress(pageState, v as string);                    
                    if (house) {
                        acc['houseID'] = house.houseID;
                        acc['ownerID'] = house.ownerID;
                    } else {
                        acc['houseID'] = null;
                        sd.invalid = 'house';
                        acc.invalidDesc = 'house';
                    }
                    break;
                case 'receivedAmount':
                case 'monthlyRent':
                case 'deposit':
                case 'petDeposit':
                    if (typeof v === 'string') {
                        v = v.replace(/[\$, ]/g, '');
                        v = parseFloat(v);
                    }
                    acc[fieldName] = v;
                    break;
                case 'receivedDate':
                case 'date':
                case 'startDate':
                    const mt = moment(v);
                    if (!mt.isValid()) {
                        sd.invalid = fieldName;                        
                        acc.invalidDesc = `bad date ${fieldName}:${v}`;
                    } else {
                        const dateStr = mt.format('YYYY-MM-DD');
                        acc[fieldName] = dateStr;
                    }
                    break;
            }
        });
        const displayData = stdDisplayField(fieldNames, { ...acc }, pageState);
        sd.displayData = displayData;
        return displayData;
    });   
}

export function getDisplayHeaders(params: IPageParms, curPageState: IPageStates) {
    
    return curPageState.curPage && curPageState.curPage.displayColumnInfo && curPageState.curPage.displayColumnInfo.map((colInfo, key) => {
        const fieldName = colInfo.field;
        let dspVal = colInfo.name;
        if (fieldName === 'receivedAmount') {
            return <>Amount <button className='btn btn-primary' onClick={async () => {
                for (let i = 0; i < curPageState.pageDetails.dataRows.length; i++) {
                    const curRow = curPageState.pageDetails.dataRows[i];
                    params.showProgress(`processing ${i}/${curPageState.pageDetails.dataRows.length}`);
                    if (curRow.dataType === 'Sheet') {
                        const sheetRow = curRow as ISheetRowData;
                        try {
                            await createPayment(params, curPageState, i, i === curPageState.pageDetails.dataRows.length - 1);
                        } catch (err) {
                            const errStr = `Error create payment ${err.message}`;
                            console.log(errStr);
                            console.log(err);
                            params.showProgress('');
                            params.setErrorStr(errStr);
                            break;
                        }
                    }
                }
                params.showProgress('done');
            }}>Process All</button></>
        }
        return <td key={key}>{            
            dspVal
        }</td>
    })
            
}