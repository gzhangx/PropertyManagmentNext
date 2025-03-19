import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters } from './GenCrud';
import { ItemType } from './GenCrudAdd';
import { createHelper, IGenListProps } from './datahelpers';

import * as RootState from '../states/RootState'
import { FieldValueType, IDBFieldDef, ISqlRequestWhereItem } from '../types';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { ItemTypeDict } from './datahelperTypes';


//props: table and displayFields [fieldNames]
export function GenList(props: IGenListProps) {
    const { table, initialPageSize } = props;
    const secCtx = usePageRelatedContext();
    const rootCtx = RootState.useRootPageContext();
    const [paggingInfo, setPaggingInfo] = useState({
        PageSize: initialPageSize|| 10,        
        pos: 0,
        total: 0,
        lastPage:0,// added since missing
    });    
    const helper = createHelper(rootCtx, secCtx, props); //props: table, sheetMapping, column
    const pageState = secCtx.pageState;
    // [
    //     { field: 'tenantID', desc: 'Id', type: 'uuid', required: true, isId: true },
    //     { field: 'dadPhone', desc: 'Dad Phone', },
    // ];
    const [mainDataRows,setMainData]=useState([]);
    const [loading,setLoading]=useState(true);
    const [columnInf, setColumnInf] = useState<IDBFieldDef[]>([]);

    if (!secCtx.googleSheetAuthInfo.googleSheetId || secCtx.googleSheetAuthInfo.googleSheetId === 'NA') {
        secCtx.reloadGoogleSheetAuthInfo();
    }
    const reload = async () => {
        let whereArray = (getPageFilters(pageState, table) as any) as ISqlRequestWhereItem[];
        const order = getPageSorts(pageState, table);
        const model = await helper.loadModel();
        await helper.loadData({
            whereArray,
            order,
            rowCount: paggingInfo.PageSize,
            offset: paggingInfo.pos*paggingInfo.PageSize,
        }).then(res => {
            const {rows, total} = res;
            setPaggingInfo({ ...paggingInfo, total, })

            const dateFields: IDBFieldDef[] = [];
            model.fields.forEach(f => {
                if (f.type === 'date' || f.type === 'datetime') {
                    dateFields.push(f);
                }
            })
            if (dateFields.length > 0) {
                rows.forEach(r => {
                    dateFields.forEach(f => {
                        const date = r[f.field];
                        if (date) {
                            //console.log('converting f', f.field, ' from ', date, 'to ', secCtx.utcDbTimeToZonedTime(date), 'root',rootCtx.userInfo.timezone);
                            r[f.field] = secCtx.utcDbTimeToZonedTime(date);
                        }
                    });
                });
            }
            setMainData(rows);
            setLoading(false);
        });
    }


    useEffect(() => {
        if (!table) return;
        //if (!helper) return;
        const ld=async () => {                        
            await helper.loadModel();
            setColumnInf(helper.getModelFields() as IDBFieldDef[]);
            //if(columnInfo) {
            //    setColumnInf(columnInfo);
            //}
            reload();
        }
        
        ld();        
    },[table || 'NA', pageState.pageProps.reloadCount, paggingInfo.pos, paggingInfo.total, secCtx.googleSheetAuthInfo.googleSheetId]);

    const doAdd = (data: ItemType, id: FieldValueType) => {        
        return helper.saveData(data,id, true, secCtx.foreignKeyLoopkup).then(res => {
            setLoading(true);            
            reload();
            return res;
        }).catch(err => {
            setLoading(false);
            console.log(err);
        });
    }

    const doDelete=( ids: string[], data: ItemTypeDict ) => {
        setLoading(true);
        helper.deleteData(ids, secCtx.foreignKeyLoopkup, data).then(() => {
            reload();
        })
    }
    const displayFields=props.displayFields||helper.getModelFields().map(f => f.isId? null:f).filter(x => x);
    return <div>
        <p className='subHeader'>{props.title}</p>
        {
            (loading||!columnInf)? <p>Loading</p>:
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

