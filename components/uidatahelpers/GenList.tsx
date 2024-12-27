import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters } from './GenCrud';
import { IColumnInfo, ItemType } from './GenCrudAdd';
import { createHelper, FieldValueType, IDisplayFieldType, IGenListProps } from './datahelpers';
import { getFKDefs } from './GenCrudTableFkTrans';

import { ISqlRequestWhereItem} from '../api'
import { useIncomeExpensesContext } from '../states/PaymentExpenseState'
import * as RootState from '../states/RootState'


//props: table and displayFields [fieldNames]
export function GenList(props: IGenListProps) {
    const { table, columnInfo, fkDefs, initialPageSize } = props;
    const secCtx = useIncomeExpensesContext();
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
    const [columnInf,setColumnInf]=useState(columnInfo || []);
    const reload = async () => {
        let whereArray = (getPageFilters(pageState, table) as any) as ISqlRequestWhereItem[];
        const order = getPageSorts(pageState, table);

        helper.loadData({
            whereArray,
            order,
            rowCount: paggingInfo.PageSize,
            offset: paggingInfo.pos*paggingInfo.PageSize,
        }).then(res => {
            const {rows, total} = res;
            setPaggingInfo({...paggingInfo, total,})
            setMainData(rows);
            setLoading(false);
        });
    }


    useEffect(() => {
        if (!table) return;
        //if (!helper) return;
        const ld=async () => {                        
            await helper.loadModel();
            setColumnInf(helper.getModelFields() as IColumnInfo[]);
            //if(columnInfo) {
            //    setColumnInf(columnInfo);
            //}
            reload();
        }
        
        ld();        
    },[table || 'NA', columnInfo, pageState.pageProps.reloadCount, paggingInfo.pos, paggingInfo.total]);

    const doAdd = (data: ItemType, id: FieldValueType) => {        
        return helper.saveData(data,id, true).then(res => {
            setLoading(true);            
            reload();
            return res;
        }).catch(err => {
            setLoading(false);
            console.log(err);
        });
    }

    const doDelete=( ids: string[] ) => {
        setLoading(true);
        helper.deleteData(ids).then(() => {
            reload();
        })
    }
    const displayFields=props.displayFields||helper.getModelFields().map(f => f.isId? null:f).filter(x => x) as IDisplayFieldType;
    return <div>
        <p className='subHeader'>{props.title}</p>
        {
            (loading||!columnInf)? <p>Loading</p>:
                <div>
                    <GenCrud
                        fkDefs={fkDefs || getFKDefs()}
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

