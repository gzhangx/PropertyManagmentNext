import React, { SetStateAction, useEffect, useState } from 'react';
import { set, get } from 'lodash';
import { v1 } from 'uuid';
import { EditTextDropdown } from '../generic/EditTextDropdown';
import { GenCrudAdd } from './GenCrudAdd';
import { ISqlOrderDef, SortOps, IPageFilter, IPageState, IDBFieldDef, TableNames, SQLOPS, FieldValueType, IFullTextSearchPart, ReactSetStateType,  } from '../types'
//import { IFKDefs} from './GenCrudTableFkTrans'
import { ICrudAddCustomObj, ITableAndSheetMappingInfo, ItemType } from './datahelperTypes';
import { usePageRelatedContext } from '../states/PageRelatedState';
import moment from 'moment';
import { BaseDialog } from '../generic/basedialog';
import { TagsInput } from '../generic/TagsInput';
import { getOriginalFilters } from './defs/util';
import { CrudFilter } from './CrudFilter';
import { standardGenListColumnFormatter } from '../utils/reportUtils';




export function getPageSorts(pageState: IPageState, table: string): ISqlOrderDef[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps.pagePropsTableInfo, [table, 'sorts']);
}
export function getPageFilters(pageState: IPageState, table: string): IPageFilter[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps.pagePropsTableInfo, [table, 'filters'], []);
}

export interface IPageInfo {
    PageSize: number;
    pos: number;
    total: number;
    lastPage: number;

    enableFullTextSearch: boolean;
}

export interface IGenGrudProps extends ITableAndSheetMappingInfo<unknown> {
    columnInfo: IDBFieldDef[];
    displayFields: IDBFieldDef[];
    rows: ItemType[];
    pageState: IPageState;
    paggingInfo: IPageInfo;
    setPaggingInfo: React.Dispatch<SetStateAction<IPageInfo>>;
    doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; }>;
    //onOK?: (data?: ItemType) => void;
    //onCancel: (data?: ItemType) => void;
    //onError?: (err: { message: string; missed: any; }) => void;

    //show: boolean;
    table: TableNames;
    //desc?: string;
    //fkDefs?: IFKDefs;
    doDelete: (ids: string[], data: ItemType) => void;
    idCol?: { field: string; }
    reload?: () => Promise<void>;    
    fullTextSearchInTyping: IFullTextSearchPart;
    setFullTextSearchInTyping: ReactSetStateType<IFullTextSearchPart>;
    //customDisplayFunc?: (value: any, fieldDef: IDBFieldDef) => React.JSX.Element;
}

export const GenCrud = (props: IGenGrudProps) => {
    const {
        columnInfo,
        displayFields,
        rows,
        pageState,
        table,
        paggingInfo, setPaggingInfo,
    } = props;

    const [dspState, setDspState] = useState<'Add' | 'Update' | 'dsp'>('dsp');
    const [editItem, setEditItem] = useState<ItemType>({
        data: {},
        _vdOriginalRecord: null,
        searchInfo: [],
    });    
    //const [enableAllCustFilters, setEnableAllCustFilters] = useState(false);    

    const [deleteConfirm, setDeleteConfirm] = useState<{
        showDeleteConfirmation: boolean;
        deleteIds: string[];
        deleteRowData: ItemType;
    }>({
        showDeleteConfirmation: false,
        deleteIds: [],
        deleteRowData: {
            data: {},
            _vdOriginalRecord: {},
            searchInfo: [],
        },
    });
    
    const [crudAddCustomObjMap, setCrudAddCustomObjMap] = useState<ICrudAddCustomObj<unknown>>({
        leaseToTenantCustOptions: {},
        paymentUIRelated_showRenterConfirmationScreen: false,
    });
    

    const [customFiltersEnabled, setCustomFiltersEnabled] = useState<{
        [tableName: string]: {
            [field: string]: boolean;
        }
    }>({});
    
    const [searchMode, setSearchMode] = useState<'fullText' | 'fieldValue'>('fullText');
    
    const { pageProps, setPageProps } = pageState;
    const mainCtx = usePageRelatedContext();
    useEffect(() => {
            mainCtx.checkLoadForeignKeyForTable(table);        
    }, [JSON.stringify(editItem)])
    
    const PageLookRangeMax = 3;
    const calcPage = () => {
        let changed = false;
        const getLastPage = (total, pageSize) => {
            const lst = Math.trunc(total / pageSize);
            if (lst * pageSize === total) return lst - 1;
            return lst;
        }
        const lastPage = getLastPage(paggingInfo.total, paggingInfo.PageSize);
        if (lastPage !== paggingInfo.lastPage) {
            paggingInfo.lastPage = lastPage;
            changed = true;
        }
        let frontPgs = PageLookRangeMax, rearPgs = PageLookRangeMax;
        let front = paggingInfo.pos - frontPgs;
        if (front < 0) rearPgs -= front;
        let back = paggingInfo.lastPage - paggingInfo.pos - rearPgs;
        if (back < 0) frontPgs -= back;

        const needFront3dots = paggingInfo.pos > frontPgs;
        const frontPageInds: number[] = [];
        for (let i = frontPgs; i > 0; i--) {
            let ind = paggingInfo.pos - i;
            if (ind >= 0) frontPageInds.push(ind);
        }
        const rearPageInds: number[] = [];
        for (let i = 1; i <= rearPgs; i++) {
            let ind = paggingInfo.pos + i;
            if (ind <= lastPage) rearPageInds.push(ind)
        }
        const needRear3dots = (paggingInfo.pos + rearPgs < lastPage);
        return {
            needFront3dots,
            needRear3dots,
            frontPageInds,
            rearPageInds,
            needsPagging: lastPage > 0,
        }
    };
    const paggingCalced = calcPage();
    const baseColumnMap: { [name: string]: IDBFieldDef } = columnInfo.reduce((acc, col) => {
        acc[col.field] = col;
        return acc;
    }, {});
    const columnMap: { [name: string]: IDBFieldDef } = displayFields.reduce((acc, col) => {
        let val = col;
        if (typeof col === 'string') {
            val = baseColumnMap[col] || displayFields[col] || { desc: `****Col ${col} not setup` } as IDBFieldDef;
            acc[col] = val;
        } else {
            const basCol = baseColumnMap[col.field];
            if (basCol) {
                if (col.displayType) {
                    basCol.displayType = col.displayType;
                }
                if (basCol.foreignKey) col.foreignKey = basCol.foreignKey;
            }
            acc[col.field] = val;
        }
        
        return acc;
    }, {} as { [name: string]: IDBFieldDef });

    const fkDefLookup: { [name: string]: IDBFieldDef } = columnInfo.reduce((acc, col) => {
        acc[col.field] = col;
        return acc;
    }, {});

    const displayFieldsStripped = displayFields.map(f => {
        if (typeof f === 'string') return f;
        if (!f.field) return `*** Field ${f}.field is empty`;
        return f.field;
    });

    // useEffect(() => {
    //     displayFieldsStripped.forEach((name) => {                                        
    //         const newCustomFiltersEnabled = { ...customFiltersEnabled };
    //         if (!newCustomFiltersEnabled[table]) {
    //             newCustomFiltersEnabled[table] = {};
    //         }
    //         newCustomFiltersEnabled[table][name] = enableAllCustFilters;
    //         setCustomFiltersEnabled(newCustomFiltersEnabled);
    //     })
    // }, [enableAllCustFilters?'true':'false']);

    const idCols = columnInfo.filter(c => c.isId);

    const addNew = async () => {
        columnInfo.map((c, cind) => {
            if (c.type === 'date' || c.type === 'datetime') {
                editItem.data[c.field] = moment().format('YYYY-MM-DD');
            } else {
                editItem.data[c.field] = '';
            }
        });
        if (props.customAddNewDefaults) {
            await props.customAddNewDefaults(mainCtx, columnInfo, editItem);
        }
        setEditItem({
            ...editItem,
        })
        setDspState('Add');
    }

    const forceUpdatePageProps = () => {
        setPageProps({ ...pageProps,  reloadCount: (pageProps.reloadCount || 0) + 1 });
    }
    const getFieldSort = (field:string) => {
        const opToIcon = {
            'asc': 'fas fa-chevron-up',
            'desc': 'fas fa-chevron-down',
        };
        const opToNext = {
            'asc': 'desc',
            'desc': '',
            '': 'asc',
        }
        //const fieldFilter = get(pageProps, [table, field, 'filter']) || {};
        const fieldSorts = getPageSorts(pageState, table) || []; //get(pageProps, [table, 'sorts'], []);
        const fieldSortFound = fieldSorts.filter(s => s.name === field)[0];
        const fieldSort = fieldSortFound || ({} as ISqlOrderDef);
        const getIconDesc = (op:string) => opToIcon[op] || 'fas fa-minus';
        const shortIcon = getIconDesc(fieldSort.op);
        const onSortClick = e => {
            e.preventDefault();
            const sort = fieldSortFound || ({
                name: field,
                //shortDesc,
            }) as ISqlOrderDef;

            sort.op = opToNext[fieldSort.op || ''] as SortOps;
            sort.shortDesc = getIconDesc(sort.op);
            if (!fieldSortFound) {
                fieldSorts.push(sort);                
                set(pageProps.pagePropsTableInfo, [table, 'sorts'], fieldSorts.filter(s => s.op));
            }
            //setPageProps({ ...pageProps });
            //setPageProps(Object.assign({}, pageProps, { reloadCount: (pageProps.reloadCount || 0) + 1 }));
            forceUpdatePageProps();
        }
        return <a href='' onClick={onSortClick} style={{marginLeft:'2px'}}><i className={shortIcon}></i></a>;
    };


    const filterOptions = ['=', '!=', '<', '<=', '>', '>='].map(value => ({ value, label: value, selected: false }));
    const defaultFilter = filterOptions.filter(x => x.value === '=')[0];
    if (defaultFilter) defaultFilter.selected = true;
    const makePageButtons = (inds, desc?:string) => inds.map((ind, keyId) => <button className="btn btn-primary" type="button" key={keyId} onClick={e => {
        e.preventDefault();
        setPaggingInfo({ ...paggingInfo, pos: ind })
    }}>{desc || ind + 1}</button>)
    return (
        <div>
            {
                dspState === 'dsp' &&
                <div>
                        <>{
                            paggingCalced.needsPagging && <div style={{ display: 'inline' }}>
                                {makePageButtons([0], '<<')}
                                {paggingCalced.needFront3dots ? '...' : ''}
                                {makePageButtons(paggingCalced.frontPageInds)}
                                {paggingInfo.pos + 1}
                                {makePageButtons(paggingCalced.rearPageInds)}
                                {paggingCalced.needRear3dots ? '...' : ''}
                                {makePageButtons([paggingInfo.lastPage], '>>')}
                            
                            </div>
                        }
                            <input className='fullTextSearchInput' value={props.fullTextSearchInTyping.val} onChange={e=>{
                                props.setFullTextSearchInTyping(prev => ({
                                    ...prev,
                                    val:e.target.value,
                                }));
                            }} placeholder='Enter full text search' ></input>
                            </>
                    
                    <div>                            
                            
                            <CrudFilter pageState={pageState} table={table}
                                mode={searchMode}
                                setMode={setSearchMode}
                                setFullTextSearchInTyping={props.setFullTextSearchInTyping}
                                columnInfo={displayFields}
                                forceUpdatePageProps={ forceUpdatePageProps}                                
                            ></CrudFilter>
                        </div>
                        
                        <BaseDialog show={deleteConfirm.showDeleteConfirmation}>
                                <>
                                    <div className="modal-dialog-scrollable">
                                        <div className="modal-content">
                                            {
                                                props.title && <div className="modal-header">
                                                    <h5 className="modal-title">{props.title}</h5>
                                                    <button type="button" className="close">
                                                        <span aria-hidden="true" onClick={()=>{}}>&times;</span>
                                                    </button>
                                                </div>
                                            }                                            
                                        </div>
                                    </div>                                    
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => {
                                        setDeleteConfirm({
                                            deleteIds: [],
                                            deleteRowData: {} as ItemType,
                                            showDeleteConfirmation: false
                                        });
                                        props.doDelete(deleteConfirm.deleteIds, deleteConfirm.deleteRowData);
                                    }}>Delete</button>
                                    <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={() => {
                                        setDeleteConfirm({
                                            deleteIds: [],
                                            deleteRowData: {
                                            } as ItemType,
                                            showDeleteConfirmation: false
                                        });                                        
                                    }}>Cancel</button>
                                        </div>                                    
                                </>
                            </BaseDialog>
                    <table  className="table bordered hover sm">
                        <thead>
                            <tr>
                                {
                                    displayFieldsStripped.map((name, ind) => {
                                        return <th key={ind}>                                            
                                            <div>
                                                <div className='gengrid-header-text-block'>
                                                    {columnMap[name] ? columnMap[name].desc : `****Column ${JSON.stringify(name)} not mapped`}
                                                    
                                                        {getFieldSort(name)}
                                                        {
                                                            false && props.customHeaderFilterFunc && <><a style={{ marginLeft: '0px' }} onClick={e => {
                                                                e.preventDefault();
                                                                const newCustomFiltersEnabled = { ...customFiltersEnabled };
                                                                if (!newCustomFiltersEnabled[table]) {
                                                                    newCustomFiltersEnabled[table] = {};
                                                                }
                                                                newCustomFiltersEnabled[table][name] = !newCustomFiltersEnabled[table][name];
                                                                setCustomFiltersEnabled(newCustomFiltersEnabled);
                                                            }}>{
                                                                    //CustFilter
                                                                    <i className='fas fa-gear' role='button'></i>
                                                                }</a></>
                                                        }
                                                    
                                                </div>                                                                                                
                                            </div>
                                            
                                            {
                                                customFiltersEnabled[table] && customFiltersEnabled[table][name] &&
                                                props.customHeaderFilterFunc(mainCtx, pageState, columnMap[name])
                                            }
                                        </th>
                                    })
                                }
                                    <th><button className="btn btn-primary" type="button" onClick={addNew}>Add</button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows?.length > 0 ? (
                                rows.map((row, ind) => {
                                    return (
                                        <tr key={ind}>
                                            {
                                                displayFieldsStripped.map((fn, find) => {
                                                    const def = fkDefLookup[fn];                                                    
                                                    const val = row.data[fn]
                                                    let dsp = val;
                                                    if (def && def.foreignKey && def.foreignKey.table) {
                                                        const fkk = mainCtx.foreignKeyLoopkup.get(def.foreignKey.table);
                                                        if (fkk) {
                                                            const desc = fkk.idDesc.get(val)?.desc;
                                                            if (desc) {
                                                                dsp = desc;
                                                            } else {
                                                                if (val) {
                                                                    dsp = 'NOTMAPPED_' + val;
                                                                } else {
                                                                    dsp = '';
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    return <td key={find}>{standardGenListColumnFormatter(dsp, def)}</td>
                                                })
                                            }
                                            <td>
                                                {idCols.length && <button className="btn btn-primary outline-primary" type="button"  onClick={() => {
                                                    setEditItem(row);
                                                    setDspState('Update');
                                                }}>Edit</button>
                                                }
                                                {' ' //className="btn-xs"
                                                }
                                                {idCols.length && <button className="btn btn-primary outline-danger" type="button" onClick={
                                                    () => {
                                                        setDeleteConfirm({
                                                            showDeleteConfirmation: true,
                                                            deleteIds: idCols.map(c => row.data[c.field]),
                                                            deleteRowData: row,
                                                        });
                                                        //props.doDelete(idCols.map(c => row[c.field]), row)
                                                    }
                                                }>Delete</button>}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr key='a'>
                                    <td colSpan={displayFieldsStripped.length + 1}>No Data found</td>
                                </tr>
                            )
                            }

                        </tbody>
                    </table>
                </div>
            }            
            {
                (dspState === 'Add' || dspState === 'Update') &&
                <GenCrudAdd {...{
                    ...props,
                        crudAddCustomObjMap, setCrudAddCustomObjMap,
                        editItem, setEditItem,
                }
            } show={true} operation={dspState}  onCancel={r => {
                setDspState('dsp')
            }}></GenCrudAdd>            
            }
            {
                props.customScreen && crudAddCustomObjMap.paymentUIRelated_showRenterConfirmationScreen && props.customScreen(crudAddCustomObjMap, setCrudAddCustomObjMap)
            }
        </div>
    )
}


export function checkOneFieldMatch(rowCellStr: string, colDef: IDBFieldDef, search: IFullTextSearchPart) {
    //const colDef = displayColumnInfo[pos];
    if (search.type === 'date') {
        const searchDate = moment(search.val);
        let searchMatchSuccess = false;
        if (colDef.type === 'date' || colDef.type === 'datetime') {
            const colDate = moment(rowCellStr);
            switch (search.op) {
                case '=':
                    searchMatchSuccess = searchDate.isSame(colDate);
                    break;
                case '>':
                    searchMatchSuccess = colDate.isAfter(searchDate);
                    break;
                case '<':
                    searchMatchSuccess = colDate.isBefore(searchDate);
                    break;
            }
        }
        return {
            op: search.op,
            lightAll: true,
            searchMatchSuccess,
        }
    }
    if (search.type === 'number') {
        let searchMatchSuccess = false;
        if (colDef.type === 'decimal') {
            const colVal = parseFloat(rowCellStr);
            const searchVal = parseFloat(search.val);
            switch (search.op) {
                case '=':
                    searchMatchSuccess = colVal == searchVal;
                    break;
                case '>':
                    searchMatchSuccess = colVal > searchVal;
                    break;
                case '<':
                    searchMatchSuccess = colVal < searchVal;
                    break;
            }
        }
        return {
            op: search.op,
            lightAll: true,
            searchMatchSuccess,
        };
    }
    return {
        searchMatchSuccess: rowCellStr.includes(search.val),
        op: 'like',
        lightAll: false,
    }
}