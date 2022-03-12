import React, { useState } from 'react';
import { set, get } from 'lodash';
import { v1 } from 'uuid';
import { EditTextDropdown, IEditTextDropdownItem, } from '../generic/EditTextDropdown';
import { GenCrudAdd, IColumnInfo, ItemType, FieldValueType } from './GenCrudAdd';

interface IPageFilter {
    id: string;
    table: string;
    field: string;
    op: string;
    val: string;
};

type SortOps = '' | 'asc' | 'desc';
interface IPageSort {
    name: string;
    op: SortOps;
    shortDesc: string;
}
export interface IPageState {
    pageProps: {
        [tableName: string]: {
            sorts: IPageSort[];
            filters: IPageFilter[];
        };
    };
    setPageProps: any;
}

export function getPageSorts(pageState: IPageState, table: string): IPageSort[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps, [table, 'sorts'], []);
}
export function getPageFilters(pageState: IPageState, table: string): IPageFilter[] {
    const { pageProps,
        //setPageProps
    } = pageState;
    return get(pageProps, [table, 'filters'], []);
}

export interface IGenGrudProps {
    columnInfo: IColumnInfo[];
    displayFields: ({ field: string; desc: string;} | string)[];
    rows: any[];
    pageState: IPageState;
    paggingInfo: {
        total: number;
        PageSize: number;
        lastPage: number;
        pos: number;
    };
    setPaggingInfo: any;
    doAdd: (data: ItemType, id: FieldValueType) => { id: string; };
    //onOK?: (data?: ItemType) => void;
    //onCancel: (data?: ItemType) => void;
    //onError?: (err: { message: string; missed: any; }) => void;

    customSelData?: { [key: string]: [IEditTextDropdownItem] };
    customFields?: ItemType;
    //show: boolean;
    table: string;
    //desc?: string;
    //fkDefs?: string;    
    doDelete: (id: string, data:any) => void;
    idCol: { field: string;}
}

export const GenCrud = (props: IGenGrudProps) => {
    const {
        columnInfo,
        displayFields,
        rows,
        customSelData,
        customFields = {},
        pageState,
        table,
        paggingInfo, setPaggingInfo,
    } = props;

    const [dspState, setDspState] = useState('dsp');
    const [editItem, setEditItem] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [filterVals, setFilterVals] = useState<IPageFilter[]>([]);
    const { pageProps, setPageProps } = pageState;
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
    const baseColumnMap = columnInfo.reduce((acc, col) => {
        acc[col.field] = col;
        return acc;
    }, {});
    const columnMap = displayFields.reduce((acc, col) => {
        let val = col;
        if (typeof col === 'string') {
            val = baseColumnMap[col] || displayFields[col] || { desc: `****Col ${col} not setup` };
            acc[col] = val;
        } else {            
            acc[col.field] = val;
        }
        
        return acc;
    }, {});

    const displayFieldsStripped = displayFields.map(f => {
        if (typeof f === 'string') return f;
        if (!f.field) return `*** Field ${f}.field is empty`;
        return f.field;
    });

    const idCol = columnInfo.filter(c => c.isId)[0];

    const addNew = () => {
        setDspState('addNew');
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
        const fieldSort = fieldSortFound || ({} as IPageSort);
        const getShortDesc = (op:string) => opToDesc[op] || 'NS';
        const shortDesc = getShortDesc(fieldSort.op);
        const onSortClick = e => {
            e.preventDefault();
            const sort = fieldSortFound || ({
                name: field,
                shortDesc,
            }) as IPageSort;

            sort.op = opToNext[fieldSort.op || ''] as SortOps;
            sort.shortDesc = getShortDesc(sort.op);
            if (!fieldSortFound) {
                fieldSorts.push(sort);
                set(pageProps, [table, 'sorts'], fieldSorts.filter(s => s.op));
            }
            setPageProps({ ...pageProps });
            //setPageProps(Object.assign({}, pageProps, { reloadCount: (pageProps.reloadCount || 0) + 1 }));
        }
        return <a href='' onClick={onSortClick}>{shortDesc}</a>;
    };
    const filterClick = e => {
        e.preventDefault();
        setShowFilter(!showFilter);
    }

    const filterOptions = ['=', '!=', '<', '<=', '>', '>='].map(value => ({ value, label: value }));
    const defaultFilter = filterOptions.filter(x => x.value === '=')[0];
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
                                                }
                                                return {
                                                    value: d.field,
                                                    label: d.desc,
                                                }
                                            })}
                                                selected={{
                                                    label: fv.field,
                                                    value: fv.field,
                                                }}
                                                
                                                onSelectionChanged={val => {
                                                    fv.field = val.value;
                                                    setFilterVals(filterVals);
                                                }
                                                }></EditTextDropdown></td>
                                            <td><EditTextDropdown items={filterOptions}
                                                selected={defaultFilter}
                                                onSelectionChanged={val => {
                                                    fv.op = val.value;
                                                    setFilterVals(filterVals);
                                                }
                                                }></EditTextDropdown></td>
                                            <td><input name={fv.field} onChange={v => {
                                                fv.val = v.target.value;
                                            }}></input></td>
                                            <td><a href="" onClick={e => {
                                                e.preventDefault();
                                                setFilterVals(filterVals.filter(f => f.id !== fv.id));
                                            }}>Remove</a></td>
                                        </tr>
                                    })
                                }
                                <tr><td><a href="" onClick={
                                    e => {
                                        e.preventDefault();
                                        setFilterVals([...filterVals,
                                        { id: v1(), table, op: defaultFilter.value, val: '', field:'' }
                                        ])
                                    }
                                } >Add</a></td>
                                    <td><a href="" onClick={
                                        e => {
                                            e.preventDefault();
                                            //console.log(filterVals);
                                            set(pageProps, [table, 'filters'], filterVals);
                                            setPageProps({ ...pageProps });
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
                            {rows.length > 0 ? (
                                rows.map((row, ind) => {
                                    return (
                                        <tr key={ind}>
                                            {
                                                displayFieldsStripped.map((fn, find) => {
                                                    const custFieldType = customFields[fn];
                                                    let val = row[fn]
                                                    let dsp = val;
                                                    if (custFieldType === 'custom_select') {
                                                        dsp = customSelData[fn];
                                                        if (!dsp || !dsp.filter) dsp = `***** unmapped field ${fn}`;
                                                        else {
                                                            dsp = dsp.filter(d => d.value === val)[0];
                                                            if (!dsp) dsp = `**** field ${fn} value ${val} not mapped`;
                                                            else {
                                                                dsp = dsp.label;
                                                            }
                                                        }
                                                    }
                                                    const dspFunc = columnMap[fn].dspFunc;
                                                    if (dspFunc) {
                                                        dsp = dspFunc(val, row);
                                                    }
                                                    return <td key={find}>{dsp}</td>
                                                })
                                            }
                                            <td>
                                                {idCol && <button className="btn btn-primary outline-primary" type="button"  onClick={() => {
                                                    setEditItem(row);
                                                    setDspState('edit');
                                                }}>Edit</button>
                                                }
                                                {' ' //className="btn-xs"
                                                }
                                                {idCol && <button className="btn btn-primary outline-danger" type="button"  onClick={() => props.doDelete(idCol.field, row[idCol.field])}>Delete</button>}
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

            <GenCrudAdd {...props} show={dspState === 'addNew'} onCancel={r => {
                console.log(r);
                setDspState('dsp')
            }}></GenCrudAdd>
            <GenCrudAdd {...props} show={dspState === 'edit'} editItem={editItem}  onCancel={() => setDspState('dsp')}></GenCrudAdd>
        </div>
    )
}