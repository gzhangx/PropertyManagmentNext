import React,{useState,useEffect} from 'react';
import { GenCrud, getPageSorts, getPageFilters, IPageState } from './GenCrud';
import { IColumnInfo, ItemType, FieldValueType } from './GenCrudAdd';
import { IFKDefs } from './GenCrudTableFkTrans'
import { createHelper, LoadMapperType } from './datahelpers';
import { getFKDefs } from './GenCrudTableFkTrans';

interface IGenListProps { //copied from gencrud, need combine and refactor later
    table: string;
    columnInfo: IColumnInfo[];    
    displayFields?: ({ field: string; desc: string; } | string)[];
    pageState: IPageState;
    loadMapper?: LoadMapperType;
    fkDefs?: IFKDefs;
    initialPageSize?: number;    
    treatData?: { [key: string]: (a: any, b: any) => any; }
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
}
//props: table and displayFields [fieldNames]
export function GenList(props: IGenListProps) {
    const {table, columnInfo, loadMapper, pageState , fkDefs, initialPageSize, treatData = {}} = props;
    const [paggingInfo, setPaggingInfo] = useState({
        PageSize: initialPageSize|| 10,        
        pos: 0,
        total: 0,
        lastPage:0,// added since missing
    });
    const helper=createHelper(table);
    // [
    //     { field: 'tenantID', desc: 'Id', type: 'uuid', required: true, isId: true },
    //     { field: 'dadPhone', desc: 'Dad Phone', },
    // ];
    const [mainDataRows,setMainData]=useState([]);
    const [loading,setLoading]=useState(true);
    const [columnInf,setColumnInf]=useState(columnInfo || []);
    const reload = async () => {
        const whereArray = getPageFilters(pageState, table);
        const order = getPageSorts(pageState, table);
        helper.loadData(loadMapper, {
            whereArray,
            order,
            rowCount: paggingInfo.PageSize,
            offset: paggingInfo.pos*paggingInfo.PageSize,
        }).then(res => {
            const {rows, total} = res;
            setPaggingInfo({...paggingInfo, total,})
            setMainData(rows.map(r=>{
                const minf = helper.getModelFields();
                return minf.reduce((acc,c)=>{
                    const tdata = treatData[c.field];
                    if (tdata)
                        acc[c.field] = tdata(c.field, r);
                    return acc;
                    },r);      
                }));
            setLoading(false);
        });
    }


    useEffect(() => {
        const ld=async () => {                        
            await helper.loadModel();
            setColumnInf(helper.getModelFields());
            //if(columnInfo) {
            //    setColumnInf(columnInfo);
            //}
            reload();
        }
        
        ld();        
    },[columnInfo, pageState.pageProps.reloadCount, paggingInfo.pos, paggingInfo.total]);

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
    const displayFields=props.displayFields||helper.getModelFields().map(f => f.isId? null:f).filter(x => x);
    return <div>
        <p className='subHeader'>{props.title}</p>
        {
            (loading||!columnInf)? <p>Loading</p>:
                <div>
                    <GenCrud
                        fkDefs={fkDefs || getFKDefs()}
                    paggingInfo={paggingInfo} setPaggingInfo={setPaggingInfo}
                    reload = {reload}
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

