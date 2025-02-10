import React, { useEffect, useState } from 'react';
import { set, get } from 'lodash';
import { v1 } from 'uuid';
import { EditTextDropdown } from '../generic/EditTextDropdown';
import { GenCrudAdd, ItemType } from './GenCrudAdd';
import { ISqlOrderDef, SortOps, IPageFilter, IPageState, IDBFieldDef, TableNames, SQLOPS, FieldValueType } from '../types'
import { IFKDefs} from './GenCrudTableFkTrans'
import { ItemTypeDict } from './datahelperTypes';
import { usePageRelatedContext } from '../states/PageRelatedState';
import moment from 'moment';




export function getPageSorts(pageState: IPageState, table: string): ISqlOrderDef[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps.pagePropsTableInfo, [table, 'sorts'], []);
}
export function getPageFilters(pageState: IPageState, table: string): IPageFilter[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps, [table, 'filters'], []);
}


export interface IGenGrudProps {
    columnInfo: IDBFieldDef[];
    displayFields: IDBFieldDef[];
    rows: any[];
    pageState: IPageState;
    paggingInfo: {
        total: number;
        PageSize: number;
        lastPage: number;
        pos: number;
    };
    setPaggingInfo: any;
    doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; }>;
    //onOK?: (data?: ItemType) => void;
    //onCancel: (data?: ItemType) => void;
    //onError?: (err: { message: string; missed: any; }) => void;

    //show: boolean;
    table: TableNames;
    //desc?: string;
    fkDefs?: IFKDefs;
    doDelete: (ids: string[], data: ItemTypeDict) => void;
    idCol?: { field: string; }
    reload?: () => Promise<void>;
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
        _vdOriginalRecord: null,
    });
    const [showFilter, setShowFilter] = useState(false);
    const [filterVals, setFilterVals] = useState<IPageFilter[]>([]);
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
        const frontPageInds = [];
        for (let i = frontPgs; i > 0; i--) {
            let ind = paggingInfo.pos - i;
            if (ind >= 0) frontPageInds.push(ind);
        }
        const rearPageInds = [];
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
            acc[col.field] = val;
        }
        
        return acc;
    }, {} as { [name: string]: IDBFieldDef });

    const displayFieldsStripped = displayFields.map(f => {
        if (typeof f === 'string') return f;
        if (!f.field) return `*** Field ${f}.field is empty`;
        return f.field;
    });

    const idCols = columnInfo.filter(c => c.isId);

    const addNew = () => {
        columnInfo.map((c, cind) => {
            if (c.type === 'date' || c.type === 'datetime') {
                editItem[c.field] = moment().format('YYYY-MM-DD');
            }
        });
        setEditItem({
            ...editItem,
        })
        setDspState('Add');
    }

    const forceUpdatePageProps = () => {
        setPageProps({ ...pageProps,  reloadCount: (pageProps.reloadCount || 0) + 1 });
    }
    const getFieldSort = (field:string) => {
        const opToDesc = {
            'asc': 'AS',
            'desc': 'DS',
        };
        const opToNext = {
            'asc': 'desc',
            'desc': '',
            '': 'asc',
        }
        //const fieldFilter = get(pageProps, [table, field, 'filter']) || {};
        const fieldSorts = getPageSorts(pageState, table); //get(pageProps, [table, 'sorts'], []);
        const fieldSortFound = fieldSorts.filter(s => s.name === field)[0];
        const fieldSort = fieldSortFound || ({} as ISqlOrderDef);
        const getShortDesc = (op:string) => opToDesc[op] || 'NS';
        const shortDesc = getShortDesc(fieldSort.op);
        const onSortClick = e => {
            e.preventDefault();
            const sort = fieldSortFound || ({
                name: field,
                shortDesc,
            }) as ISqlOrderDef;

            sort.op = opToNext[fieldSort.op || ''] as SortOps;
            sort.shortDesc = getShortDesc(sort.op);
            if (!fieldSortFound) {
                fieldSorts.push(sort);                
                set(pageProps.pagePropsTableInfo, [table, 'sorts'], fieldSorts.filter(s => s.op));
            }
            //setPageProps({ ...pageProps });
            //setPageProps(Object.assign({}, pageProps, { reloadCount: (pageProps.reloadCount || 0) + 1 }));
            forceUpdatePageProps();
        }
        return <a href='' onClick={onSortClick}>{shortDesc}</a>;
    };
    const filterClick = e => {
        e.preventDefault();
        setShowFilter(!showFilter);
    }

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
                    {
                        paggingCalced.needsPagging && <div>
                            {makePageButtons([0], '<<')}
                            {paggingCalced.needFront3dots ? '...' : ''}
                            {makePageButtons(paggingCalced.frontPageInds)}
                            {paggingInfo.pos + 1}
                            {makePageButtons(paggingCalced.rearPageInds)}
                            {paggingCalced.needRear3dots ? '...' : ''}
                            {makePageButtons([paggingInfo.lastPage], '>>')}
                        </div>
                    }
                    <div>
                        <a href="" onClick={filterClick}>{showFilter ? 'Hide' : 'Filter'}</a>
                        {
                            showFilter && <table>
                                {
                                    filterVals.map((fv, ind) => {
                                        return <tr key={ind}>
                                            <td><EditTextDropdown items={displayFields.map(d => {
                                                if (typeof d === 'string') return {
                                                    value: d,
                                                    label: d,
                                                    selected: fv.field === d,
                                                }
                                                return {
                                                    value: d.field,
                                                    label: d.name,
                                                    selected: fv.field === d.field,
                                                }
                                            })}                                                
                                                
                                                onSelectionChanged={val => {
                                                    fv.field = val.value;
                                                    setFilterVals(filterVals);
                                                    forceUpdatePageProps();
                                                }
                                                }></EditTextDropdown></td>
                                            <td><EditTextDropdown items={filterOptions}
                                                onSelectionChanged={val => {
                                                    fv.op = val.value;
                                                    setFilterVals(filterVals);
                                                    forceUpdatePageProps();
                                                }
                                                }></EditTextDropdown></td>
                                            <td><input name={fv.field} onChange={v => {
                                                fv.val = v.target.value;
                                                setFilterVals(filterVals);
                                                forceUpdatePageProps();
                                            }}></input></td>
                                            <td><a href="" onClick={e => {
                                                e.preventDefault();
                                                const newFilterVals = filterVals.filter(f => f.id !== fv.id);
                                                setFilterVals(newFilterVals);
                                                set(pageProps, [table, 'filters'], newFilterVals);
                                                //setPageProps({ ...pageProps });
                                                forceUpdatePageProps();
                                            }}>Remove</a></td>
                                        </tr>
                                    })
                                }
                                <tr><td><a href="" onClick={
                                    e => {
                                        e.preventDefault();
                                        const newFilterVals = [...filterVals,
                                        { id: v1(), table, op: defaultFilter.value as SQLOPS, val: '', field: '' }
                                        ];
                                        setFilterVals(newFilterVals);
                                        set(pageProps, [table, 'filters'], newFilterVals);
                                        //setPageProps({ ...pageProps });
                                        forceUpdatePageProps();
                                    }
                                } >Add</a></td>
                                    <td><a href="" onClick={
                                        e => {
                                            e.preventDefault();
                                            //console.log(filterVals);
                                            set(pageProps, [table, 'filters'], filterVals);
                                            //setPageProps({ ...pageProps });
                                            forceUpdatePageProps();
                                            //setPageProps(Object.assign({}, pageProps, { reloadCount: (pageProps.reloadCount || 0) + 1 }));
                                        }
                                    } >Submit</a></td>
                                </tr>
                            </table>
                        }
                    </div>
                    <table  className="table bordered hover sm">
                        <thead>
                            <tr>
                                {
                                    displayFieldsStripped.map((name, ind) => {
                                        return <th key={ind}>
                                            <div>{columnMap[name] ? columnMap[name].desc : `****Column ${JSON.stringify(name)} not mapped`}</div>
                                            <div>{getFieldSort(name)}</div>
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
                                                    let val = row[fn]
                                                    let dsp = val;
                                                    return <td key={find}>{dsp}</td>
                                                })
                                            }
                                            <td>
                                                {idCols.length && <button className="btn btn-primary outline-primary" type="button"  onClick={() => {
                                                    setEditItem({
                                                        ...row,
                                                        _vdOriginalRecord: row,
                                                    });
                                                    setDspState('Update');
                                                }}>Edit</button>
                                                }
                                                {' ' //className="btn-xs"
                                                }
                                                {idCols.length && <button className="btn btn-primary outline-danger" type="button"  onClick={() => props.doDelete(idCols.map(c=>row[c.field]), row)}>Delete</button>}
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
            <GenCrudAdd {...props} show={true} operation={dspState} editItem={editItem} setEditItem={setEditItem}  onCancel={r => {
                setDspState('dsp')
            }}></GenCrudAdd>            
            }
        </div>
    )
}
