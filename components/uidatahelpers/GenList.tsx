import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters, IDisplayFieldType } from './GenCrud';
import { IColumnInfo, ItemType } from './GenCrudAdd';
import { IFKDefs } from './GenCrudTableFkTrans'
import { createHelper, DataToDbSheetMapping, FieldValueType } from './datahelpers';
import { getFKDefs } from './GenCrudTableFkTrans';

import { IDBFieldDef, TableNames } from '../types'
import { ISqlRequestWhereItem} from '../api'
import { useIncomeExpensesContext } from '../states/PaymentExpenseState'


interface IGenListProps { //copied from gencrud, need combine and refactor later
    table: TableNames;
    columnInfo: IColumnInfo[];    
    displayFields?: IDisplayFieldType;
    fkDefs?: IFKDefs;
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
    doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; }>;

    sheetMapping?: DataToDbSheetMapping;
}
//props: table and displayFields [fieldNames]
export function GenList(props: IGenListProps) {
    const { table, columnInfo, fkDefs, initialPageSize } = props;
    const secCtx = useIncomeExpensesContext();
    const [paggingInfo, setPaggingInfo] = useState({
        PageSize: initialPageSize|| 10,        
        pos: 0,
        total: 0,
        lastPage:0,// added since missing
    });
    const helper = createHelper(table, secCtx.googleSheetAuthInfo.googleSheetId, props.sheetMapping);
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
        return helper.saveData(data,id).then(res => {
            setLoading(true);            
            reload();
            return res;
        }).catch(err => {
            setLoading(false);
            console.log(err);
        });
    }

    const doDelete=( field, id ) => {
        setLoading(true);
        helper.deleteData(id).then(() => {
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

