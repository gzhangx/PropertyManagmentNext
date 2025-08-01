import React, { SetStateAction, useEffect, useState } from 'react';
import { set, get } from 'lodash';
import { v1 } from 'uuid';
import { EditTextDropdown } from '../generic/EditTextDropdown';
import { GenCrudAdd } from './GenCrudAdd';
import { ISqlOrderDef, SortOps, IPageFilter, IPageState, IDBFieldDef, TableNames, SQLOPS, FieldValueType, IFullTextSearchPart, ReactSetStateType,  } from '../types'
//import { IFKDefs} from './GenCrudTableFkTrans'
import { ALLFieldNames, GenCrudCustomEndColAddDelType, ICrudAddCustomObj, ITableAndSheetMappingInfo, ItemType } from './datahelperTypes';
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
    doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; message: string; affectedRows?: number; changedRows?: number; }>;
    //onOK?: (data?: ItemType) => void;
    //onCancel: (data?: ItemType) => void;
    //onError?: (err: { message: string; missed: any; }) => void;

    //show: boolean;
    table: TableNames;
    //desc?: string;
    //fkDefs?: IFKDefs;
    doDelete: (ids: string[], data: ItemType) => void;
    idCol?: { field: string; }
    reload: (forceFullReload:boolean) => Promise<void>;    
    fullTextSearchInTyping: IFullTextSearchPart;
    setFullTextSearchInTyping: ReactSetStateType<IFullTextSearchPart>;
    //customDisplayFunc?: (value: any, fieldDef: IDBFieldDef) => React.JSX.Element;

    //customEndColAddDel?: GenCrudCustomEndColAddDelType;
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

    const customEndColAddDel = props.customEndColAddDel || ((cfg) => <>{cfg.add} {cfg.del}</>);
    const [dspState, setDspState] = useState<'Add' | 'Update' | 'dsp'>('dsp');
    const [editItem, setEditItem] = useState<ItemType>({
        data: {},
        _vdOriginalRecord: undefined,
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
        const getLastPage = (total: number, pageSize: number) => {
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
    }, {} as any);
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
    }, {} as any);

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

    const addNew = async (moreProcesses?: (editItem: ItemType)=>Promise<void>) => {
        columnInfo.map((c, cind) => {
            if (c.type === 'date' || c.type === 'datetime') {
                editItem.data[c.field as ALLFieldNames] = moment().format('YYYY-MM-DD');
            } else if (c.type === 'decimal' || c.type === 'int') {
                editItem.data[c.field as ALLFieldNames] = 0;
            } else {
                editItem.data[c.field as ALLFieldNames] = '';
            }
        });
        if (props.customAddNewDefaults) {
            await props.customAddNewDefaults(mainCtx, columnInfo, editItem);
        }
        if (moreProcesses) {
            await moreProcesses(editItem);
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
        const getIconDesc = (op:string) => opToIcon[op as 'asc'] || 'fas fa-minus';
        const shortIcon = getIconDesc(fieldSort.op);
        const onSortClick = (e: any) => {
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
    const makePageButtons = (inds: any, desc?:string) => inds.map((ind: any, keyId: number) => <button className="btn btn-primary" type="button" key={keyId} onClick={e => {
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
                            </>
                    
                        <div className="crudFilterDiv">                            
                            
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
                                                props.customHeaderFilterFunc && 
                                                props.customHeaderFilterFunc(mainCtx, pageState, columnMap[name])
                                            }
                                        </th>
                                    })
                                }
                                    <th><button className="btn btn-primary" type="button" onClick={()=>addNew()}>Add</button></th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows?.length > 0 ? (
                                rows.map((row, ind) => {
                                    return (
                                        <tr key={ind}>
                                            {
                                                displayFieldsStripped.map((fn, findIndex) => {
                                                    const def = fkDefLookup[fn];                                                    
                                                    const val = row.data[fn as ALLFieldNames]
                                                    let dsp = val;
                                                    if (def && def.foreignKey && def.foreignKey.table) {
                                                        const fkk = mainCtx.foreignKeyLoopkup.get(def.foreignKey.table);
                                                        if (fkk) {
                                                            const desc = fkk.idDesc.get(val as string)?.desc;
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

                                                    let fullTextSearchHighLight: IFullTextSearchCheckOneFieldMatch | null = null;
                                                    let dspLine: (React.JSX.Element | string) = standardGenListColumnFormatter(dsp, def);
                                                    let dspClass = '';
                                                    if (props.fullTextSearchInTyping.val) {
                                                        fullTextSearchHighLight = checkOneFieldMatch(row.searchInfo?.[findIndex]?.[0] || val as string, def, props.fullTextSearchInTyping);                                
                                                        if (!fullTextSearchHighLight.searchMatchSuccess && row.searchInfo?.[findIndex]?.[1]) {
                                                            fullTextSearchHighLight = checkOneFieldMatch(row.searchInfo?.[findIndex]?.[1] || dspLine, def, props.fullTextSearchInTyping);
                                                        }                                                        
                                                        if (fullTextSearchHighLight) {
                                                            if (fullTextSearchHighLight.searchMatchSuccess) {                                                                                                                                
                                                                if (fullTextSearchHighLight.lightAll) {
                                                                    dspClass = 'fulTextHightLightYellow';
                                                                } else {                                                                    
                                                                    dspLine = getSerchHighlightDsp(dspLine, def, props.fullTextSearchInTyping) as string
                                                                }
                                                            }
                                                        }
                                                    }                                                    

                                                    
                                                    return <td key={findIndex} className={dspClass}>{dspLine}</td>
                                                })
                                            }
                                            <td>
                                                {
                                                    customEndColAddDel({
                                                        addNew,
                                                        add: idCols.length ?<button className="btn btn-primary outline-primary" type="button" onClick={() => {
                                                            setEditItem(row);
                                                            setDspState('Update');
                                                        }}>Edit</button> : null,
                                                        del: idCols.length ?<button className="btn btn-secondary outline-danger" type="button" onClick={
                                                            () => {
                                                                setDeleteConfirm({
                                                                    showDeleteConfirmation: true,
                                                                    deleteIds: idCols.map(c => row.data[c.field as ALLFieldNames]) as string[],
                                                                    deleteRowData: row,
                                                                });
                                                                //props.doDelete(idCols.map(c => row[c.field]), row)
                                                            }
                                                        }>Delete</button> : null,
                                                        row
                                                    })
                                                }                                                                                 
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
                props.customScreen && crudAddCustomObjMap.paymentUIRelated_showRenterConfirmationScreen && props.customScreen(mainCtx, crudAddCustomObjMap, setCrudAddCustomObjMap)
            }
        </div>
    )
}


interface IFullTextSearchCheckOneFieldMatch {
    op: '>' | '<' | '=' | 'like' | '';
    lightAll: boolean;
    searchMatchSuccess: boolean;
}

export function checkOneFieldMatch(rowCellStr: string, colDef: IDBFieldDef, search: IFullTextSearchPart): IFullTextSearchCheckOneFieldMatch {
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
        searchMatchSuccess: (rowCellStr || '').toString().includes(search.val),
        op: 'like',
        lightAll: false,
    }
}


//string, date or accounting
function getSerchHighlightDsp(dspLine: string, def: IDBFieldDef, fullTextSearchInTyping: IFullTextSearchPart) {    
    if (!dspLine) {        
        return dspLine;
    }
    if (typeof dspLine === 'number') {        
        dspLine = (dspLine as number).toString();
    }
    const startIndex = dspLine.toLowerCase().indexOf(fullTextSearchInTyping.val);    
    if (startIndex >= 0) {
        const len = fullTextSearchInTyping.val.length;
        return <div style={{ display: 'block' }}><span>{dspLine.substring(0, startIndex)}</span><span className='fulTextHightLightYellow'>{
            dspLine.substring(startIndex, startIndex + len)
        }</span>
            <span>{dspLine.substring(startIndex + len)}</span>
        </div>
    }
    if (def.displayType === 'currency') {
        //match val to line, all char on val must match line
        function findCurrencyPartPosition(currencyStr: string, part: string) {
            // Validate inputs
            if (!currencyStr || !part) {
                return { start: -1, end: -1, error: "Invalid input" };
            }

            // Remove currency symbols and commas for matching
            const cleanedCurrency = currencyStr.replace(/[^0-9.]/g, '');
            const cleanedPart = part.replace(/[^0-9.]/g, '');

            // Check if part exists in cleaned currency string
            const matchIndex = cleanedCurrency.indexOf(cleanedPart);
            if (matchIndex === -1) {
                return { start: -1, end: -1, error: "Part not found" };
            }

            // Map cleaned positions to original string
            let cleanedPos = 0;
            let originalPos = 0;
            let startPos = -1;
            let endPos = -1;

            // Find start position
            while (cleanedPos < matchIndex && originalPos < currencyStr.length) {
                if (/[0-9.]/.test(currencyStr[originalPos])) {
                    cleanedPos++;
                }
                originalPos++;
            }
            startPos = originalPos;

            // Find end position
            cleanedPos = matchIndex;
            while (cleanedPos < matchIndex + cleanedPart.length && originalPos < currencyStr.length) {
                if (/[0-9.]/.test(currencyStr[originalPos])) {
                    cleanedPos++;
                }
                originalPos++;
            }
            endPos = originalPos;

            return { start: startPos, end: endPos };
        }

        // Example usage
        const starEnd = findCurrencyPartPosition(dspLine, fullTextSearchInTyping.val);
        if (starEnd.start >= 0) {
            return <div style={{ display: 'block' }}><span>{dspLine.substring(0, starEnd.start)}</span><span className='fulTextHightLightYellow'>{
                dspLine.substring(starEnd.start, starEnd.end)
            }</span>
                <span>{dspLine.substring(starEnd.end)}</span>
            </div>
        }
        return dspLine;
    } else if (def.displayType === 'date') {
        function findDateMatch(fullDate: string, searchStr: string): { start: number; end: number; }[] {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fullDate)) {
                return null as any;
            }            
            const [mm, dd, yyyy] = fullDate.split('/');
            const originalDate = fullDate; // MM/DD/YYYY
            const fullIsoDate = `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD

            // Check if the searchStr is in the original date
            if (originalDate.includes(searchStr)) {
                const start = originalDate.indexOf(searchStr);
                const end = start + searchStr.length - 1;
                return [{ start, end }];
            }

            // Check if the searchStr is in the alternative date

            const foundStart = fullIsoDate.indexOf(searchStr);
            const yearpart = {
                start: -1,
                end: -1,
            }
            const monthPart = {
                start: -1,
                end: -1,
            }
            const MONOFF = 5;
            const YEAROFF = 6;
            if (foundStart >= 0) {
                if (foundStart < 4) {
                    //got year part
                    yearpart.start = foundStart + YEAROFF;
                    yearpart.end = 4 + YEAROFF;
                    const yearPartLen = 4 - foundStart;
                    const MMDDLen = searchStr.length - yearPartLen - 1;
                    monthPart.start = 0;
                    monthPart.end = MMDDLen;
                    return [monthPart, yearpart]
                } else if (foundStart < 7) {
                    //has MM/DD, M/DD, M/D
                    monthPart.start = foundStart - MONOFF;
                    monthPart.end = monthPart.start + searchStr.length;
                    return [monthPart];
                }
                //impossible to have only date
            }            

            return null as any; // no match found
        }

        const starEnds = findDateMatch(dspLine, fullTextSearchInTyping.val);        
        if (!starEnds) return dspLine;
        let curStart = 0;
        return <div style={{ display: 'block' }}>

            {
                starEnds.map((starEnd, at) => {
                    const start = curStart;
                    curStart = starEnd.end;
                    return <><span>{dspLine.substring(start, starEnd.start)}</span><span className='fulTextHightLightYellow'>{
                        dspLine.substring(starEnd.start, starEnd.end)
                    }</span>{
                            at === starEnds.length - 1 && <span>{dspLine.substring(starEnd.end)}</span>       
                    }                        
                    </>
                })
            }

        </div>
    }
        //string, do standard split        
}