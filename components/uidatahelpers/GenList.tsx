import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters, IPageInfo } from './GenCrud';
import { createHelper } from './datahelpers';

import * as RootState from '../states/RootState'
import { FieldValueType, IDBFieldDef, ISqlOrderDef, ISqlRequestWhereItem, ReactSetStateType } from '../types';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { ITableAndSheetMappingInfo, ItemType, ItemTypeDict } from './datahelperTypes';
import { getPageFilterSorterErrors } from './defs/util';
import { orderBy } from 'lodash';
import moment from 'moment';
import { formatAccounting } from '../utils/reportUtils';
import { IPageRelatedState } from '../reportTypes';


//props: table and displayFields [fieldNames]
export function GenList(props: ITableAndSheetMappingInfo<unknown>) {
    const { table, initialPageSize } = props;
    const secCtx = usePageRelatedContext();
    const rootCtx = RootState.useRootPageContext();
    const [paggingInfo, setPaggingInfo] = useState <IPageInfo>({
        PageSize: initialPageSize|| 10,        
        pos: 0,
        total: 0,
        lastPage: 0,// added since missing
        enableFullTextSearch: true,
    });    
    const helper = createHelper(rootCtx, secCtx, props); //props: table, sheetMapping, column
    const pageState = secCtx.pageState;
    // [
    //     { field: 'tenantID', desc: 'Id', type: 'uuid', required: true, isId: true },
    //     { field: 'dadPhone', desc: 'Dad Phone', },
    // ];
    const [mainDataRows, setMainData] = useState<ItemType[]>([]);
    const [allDataRows, setAllData] = useState<ItemType[]>([]);
    const [columnInf, setColumnInf] = useState<IDBFieldDef[]>([]);

    const [lastDataLoadWhereClaus, setLastDataLoadWhereClaus] = useState('');
    const [lastDataRowOrder, setLastDataRowOrder] = useState('');

    const [fullTextSearch, setFullTextSearch] = useState('');

    if (!secCtx.googleSheetAuthInfo.googleSheetId || secCtx.googleSheetAuthInfo.googleSheetId === 'NA') {
        secCtx.reloadGoogleSheetAuthInfo();
    }
    const reload = async (columnInf: IDBFieldDef[], forceReload = false) => {
        let whereArray = (getPageFilters(pageState, table) as any) as ISqlRequestWhereItem[];
        const order = getPageSorts(pageState, table);        
        const pfse = getPageFilterSorterErrors(pageState, table);
        if ((!order || order.length === 0) && props.sortFields) {                        
            pfse.sorts = props.sortFields.map(f => {
                return {
                    name: f,
                    op: 'desc',
                    shortDesc: 'DSC',
                }
            });            
        }

        await secCtx.checkLoadForeignKeyForTable(table);   
        //helper will conver date back from utc to local
        let rowCount = paggingInfo.PageSize;
        const offset = paggingInfo.pos * paggingInfo.PageSize; 
        let offsetToUse = offset;
        if (paggingInfo.enableFullTextSearch) {
            offsetToUse = 0;
            rowCount = Number.MAX_SAFE_INTEGER;
        }

        let needReload = true;
        if (paggingInfo.enableFullTextSearch) {
            const newWhereClaus = table+':'+JSON.stringify(whereArray);
            if (lastDataLoadWhereClaus === newWhereClaus ) {
                needReload = false;
            } else {
                setLastDataLoadWhereClaus(newWhereClaus);
                //setLastDataRowOrder(JSON.stringify(order));
            }
        }

        if (forceReload) {
            needReload = true;
        }

        if (needReload) {
            await helper.loadData({
                whereArray,
                order,
                rowCount,
                offset: offsetToUse,
            }).then(res => {
                const { rows, total } = res;
                if (rows.length === 0 && total && paggingInfo.pos > 0) {
                    //this is some other table's page
                    setPaggingInfo({ ...paggingInfo, total, pos: 0 })
                } else {
                    let pos = paggingInfo.pos;
                    if (total < paggingInfo.PageSize * paggingInfo.pos) {
                        pos = 0;
                    }
                    if (paggingInfo.total !== total || paggingInfo.pos !== pos) {
                        setPaggingInfo({ ...paggingInfo, total, pos });
                    }
                }
                const dcinf =getDspFieldInfo(props, columnInf);
                const rowsParsed: ItemType[] = rows.map(r => {
                    const ret: ItemType = {
                        data: r,
                        _vdOriginalRecord: r,
                        searchInfo: [],
                    };
                    ret.searchInfo = getStdSearchInfo(secCtx, ret, dcinf);
                    return ret;
                })
                if (paggingInfo.enableFullTextSearch) {
                    setAllData(rowsParsed);
                    //setMainData(rowsParsed.slice(offset, offset + paggingInfo.PageSize))
                    calcAllDataSortAndPaggingInfo({
                        allDataRows: rowsParsed,
                        fullTextSearch,
                        offset,
                        paggingInfo,
                        setMainData,
                        setPaggingInfo,
                    });
                } else {
                    setMainData(rowsParsed);
                }
                return rowsParsed;
                //setLoading(false);
            });
        } else {
            let orderedRows = allDataRows;
            if (order && order.length) {
                const dirOrder = order.filter(o => o.op);

                const orderStr = JSON.stringify(dirOrder);
                if (orderStr !== lastDataRowOrder) {
                    setLastDataRowOrder(orderStr);
                    orderedRows = orderBy(allDataRows, dirOrder.map(o => `data.${o.name}`), dirOrder.map(o => o.op) as 'asc'[]);                    
                    setAllData(orderedRows);
                }

            }
            calcAllDataSortAndPaggingInfo({
                allDataRows: orderedRows,
                fullTextSearch,
                offset,
                paggingInfo,
                setMainData,
                setPaggingInfo,
            });
            //const dspRows = orderedRows.slice(offset, offset + paggingInfo.PageSize);
            //setMainData(dspRows)
        }
    }


    useEffect(() => {
        if (!table) return;
        //if (!helper) return;
        const ld=async () => {                        
            await helper.loadModel();
            let columnInfo = helper.getModelFields() as IDBFieldDef[];
            if (props.orderColunmInfo) {
                columnInfo = props.orderColunmInfo(columnInfo);
            }
            setColumnInf(columnInfo);
            //if(columnInfo) {
            //    setColumnInf(columnInfo);
            //}
            reload(columnInfo);
        }
        
        ld();        
    }, [table || 'NA', pageState.pageProps.reloadCount, secCtx.googleSheetAuthInfo.googleSheetId, paggingInfo.pos, fullTextSearch]); //paggingInfo.pos, paggingInfo.total

    const doAdd = (data: ItemType, id: FieldValueType) => {
        return helper.saveData(data,id, true, secCtx.foreignKeyLoopkup).then(res => {
            const isUpdateExisting = !!id;  //if  we have id it is updateExisting
            //setLoading(true);
            reload(columnInf, isUpdateExisting);  //force reload on update (for google sheet comp)
            return res;
        }).catch(err => {
            //setLoading(false);
            console.log(err);
        });
    }

    const doDelete=( ids: string[], data: ItemType ) => {
        //setLoading(true);
        helper.deleteData(ids, secCtx.foreignKeyLoopkup, data).then(() => {
            reload(columnInf);
        })
    }
    const displayFields=props.displayFields||helper.getModelFields().map(f => f.isId? null:f).filter(x => x);
    return <div>
        <p className='subHeader'>{props.title}</p>
        {
            (!columnInf)? <p>Loading</p>:
                <div>
                    <GenCrud
                        //fkDefs={getFKDefs()}
                    paggingInfo={paggingInfo} setPaggingInfo={setPaggingInfo}
                    reload = {()=>reload(columnInf)}
                    pageState = {pageState}
                        {...props}
                        displayFields={displayFields}
                        columnInfo={
                            columnInf
                        }
                        doAdd={doAdd}
                        doDelete={doDelete}
                        rows={mainDataRows}
                        fullTextSearch={fullTextSearch}
                        setFullTextSearch = {setFullTextSearch}
                    ></GenCrud>
                </div>
        }
    </div>
}


export function getDspFieldInfo(props: ITableAndSheetMappingInfo<unknown>, allColumns: IDBFieldDef[]) {
    if (!props.displayFields) return allColumns;
    return props.displayFields.map(f=>{
        return allColumns.find(c=>c.field === f.field || c.field === f as any)
    }).filter(x=>x);
}
function getStdSearchInfo(mainCtx:IPageRelatedState, itm: ItemType, columnInfo: IDBFieldDef[]) {
    const res: string[][] = [];
    for (const c of columnInfo) {
        let v = itm.data[c.field] as string;
        switch(c.type) {
            case 'date':
            case 'datetime':
                const mm = moment(v);
                res.push([mm.format('YYYY-MM-DD'), mm.format('MM/DD/YYYY')])
                    break;
            case 'decimal':
                res.push([(v??'').toString(), formatAccounting(v)]);
                break;
            default:
                if (v) {
                    if (c.foreignKey && c.foreignKey.table) {
                        v = mainCtx.translateForeignLeuColumn(c, itm.data);
                    } 
                    res.push([v.toString().toLowerCase()])
                }

        }
    }
    return res;
}



interface ISortingAndPaggingInfo {
    allDataRows: ItemType[];
    paggingInfo: IPageInfo;
    //order: ISqlOrderDef[];

    fullTextSearch: string;
    offset: number;
    setMainData: ReactSetStateType<ItemType[]>;
    setPaggingInfo: ReactSetStateType<IPageInfo>;
}


function calcAllDataSortAndPaggingInfo(info: ISortingAndPaggingInfo) {
    let rowsAfterTextSearch = info.allDataRows;
    if (info.fullTextSearch) {
        rowsAfterTextSearch = info.allDataRows.filter(r => {
            if (!r.searchInfo) return true;
            return r.searchInfo.reduce((acc, rr) => {
                if (rr.find(rrr => rrr.includes(info.fullTextSearch))) return true;
                return acc;
            }, false);
        });
    }
    if (info.offset > rowsAfterTextSearch.length) {
        info.offset = 0;
        info.paggingInfo.pos = 0;
        info.setPaggingInfo({ ...info.paggingInfo });
    }
    const dspRows = rowsAfterTextSearch.slice(info.offset, info.offset + info.paggingInfo.PageSize);
    info.setMainData(dspRows)
}