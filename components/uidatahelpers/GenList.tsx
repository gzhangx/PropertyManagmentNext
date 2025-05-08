import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters, IPageInfo } from './GenCrud';
import { ItemType } from './GenCrudAdd';
import { createHelper } from './datahelpers';

import * as RootState from '../states/RootState'
import { FieldValueType, IDBFieldDef, ISqlRequestWhereItem } from '../types';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { ITableAndSheetMappingInfo, ItemTypeDict } from './datahelperTypes';
import { getPageFilterSorterErrors } from './defs/util';


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
    const [mainDataRows, setMainData] = useState([]);
    const [allDataRows, setAllData] = useState([]);
    const [columnInf, setColumnInf] = useState<IDBFieldDef[]>([]);

    const [lastDataLoadWhereClaus, setLastDataLoadWhereClaus] = useState('');

    if (!secCtx.googleSheetAuthInfo.googleSheetId || secCtx.googleSheetAuthInfo.googleSheetId === 'NA') {
        secCtx.reloadGoogleSheetAuthInfo();
    }
    const reload = async () => {
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
            const newWhereClaus = JSON.stringify(whereArray);
            if (lastDataLoadWhereClaus === newWhereClaus ) {
                needReload = false;
            } else {
                setLastDataLoadWhereClaus(newWhereClaus);
            }
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
                    setPaggingInfo({ ...paggingInfo, total, })
                }
                if (paggingInfo.enableFullTextSearch) {
                    setAllData(rows);
                    setMainData(rows.slice(offset, offset + paggingInfo.PageSize))
                } else {
                    setMainData(rows);
                }
                return rows;
                //setLoading(false);
            });
        } else {
            setMainData(allDataRows.slice(offset, offset + paggingInfo.PageSize))
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
            reload();
        }
        
        ld();        
    }, [table || 'NA', pageState.pageProps.reloadCount, secCtx.googleSheetAuthInfo.googleSheetId, paggingInfo.pos]); //paggingInfo.pos, paggingInfo.total

    const doAdd = (data: ItemType, id: FieldValueType) => {        
        return helper.saveData(data,id, true, secCtx.foreignKeyLoopkup).then(res => {
            //setLoading(true);
            reload();
            return res;
        }).catch(err => {
            //setLoading(false);
            console.log(err);
        });
    }

    const doDelete=( ids: string[], data: ItemTypeDict ) => {
        //setLoading(true);
        helper.deleteData(ids, secCtx.foreignKeyLoopkup, data).then(() => {
            reload();
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
                    reload = {reload}
                    pageState = {pageState}
                        {...props}
                        displayFields={displayFields}
                        columnInfo={
                            columnInf
                        }
                        doAdd={doAdd}
                        doDelete={doDelete}
                        rows={mainDataRows}
                    ></GenCrud>
                </div>
        }
    </div>
}

