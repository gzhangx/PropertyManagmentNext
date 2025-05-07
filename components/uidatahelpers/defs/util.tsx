import { get, set } from 'lodash'
import { IDBFieldDef, IPageFilter, IPageFilterSortErrors, IPageState, SQLOPS, TableNames } from "../../types";
import moment from 'moment';
import { IPageRelatedState } from '../../reportTypes';
import { IEditTextDropdownItem } from '../../generic/GenericDropdown';
import GrkEditableDropdown from '../../generic/GrkEditableDropdown';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export const CUST_FILTER_HEADER = 'CUST_FILTER_HEADER';
export const forceUpdateFilterVals = (pageState: IPageState) => {
    const { pageProps, setPageProps } = pageState;
    setPageProps({ ...pageProps, reloadCount: (pageProps.reloadCount || 0) + 1 });
}

export const updateFilterValsNoSubmit = (pageState: IPageState) => {
    const { pageProps, setPageProps } = pageState;
    setPageProps({ ...pageProps});
}


export function getPageFilterSorterErrors(pageState: IPageState, table: TableNames): IPageFilterSortErrors {
    let ret = pageState.pageProps.pagePropsTableInfo[table] as IPageFilterSortErrors;
    if (ret) return ret;
    ret = {
        filters: [],
        sorts: [],
        filterErrors: {},
    };
    pageState.pageProps.pagePropsTableInfo[table] = ret;
    return ret;
}

export function getOriginalFilters(pageState: IPageState, table: TableNames): IPageFilter[] {
    //const { pageProps, setPageProps } = pageState;
    //const origFilters: IPageFilter[] = get(pageProps.pagePropsTableInfo, [table, 'filters']) || [];    
    //return origFilters;
    return getPageFilterSorterErrors(pageState, table).filters;
}

function isValid(val: string, colInfo: IDBFieldDef): boolean {
    if (colInfo.type === 'date' || colInfo.type === 'datetime') {
        return moment(val).isValid();
    } else if (colInfo.type === 'decimal') {
        return !isNaN(Number(val));
    } 
    return true;
}

function stdOnChange(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames, val: string, id: string, valObj: IPageFilter, op: SQLOPS) {
    const { pageProps } = pageState;
    const pfse = getPageFilterSorterErrors(pageState, table);
    const origFilters: IPageFilter[] = pfse.filters;
    if (valObj) {
        valObj.val = val;
        if (!val) {            
            origFilters.splice(origFilters.indexOf(valObj), 1);
            //set(pageProps.pagePropsTableInfo, [table, 'filters'], origFilters);
        }        
    } else {        
        origFilters.push({ id, field: colInfo.field, val, op, table, valDescUIOnly: val });
        //set(pageProps.pagePropsTableInfo, [table, 'filters'], origFilters);
    }


    if (val && !isValid(val, colInfo)) {
        //set(pageProps.pagePropsTableInfo, [table, 'filterErrors', id], true);
        pfse.filterErrors[id] = `Invalid val for ${colInfo.field} ${val}`;
        return updateFilterValsNoSubmit(pageState);
    }
    set(pageProps, [table, 'filterErrors', id], false);
    forceUpdateFilterVals(pageState);
}
export function genericCustomHeaderFilterFunc(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames): (React.JSX.Element | null) {
    const { pageProps, setPageProps } = pageState;
    if (colInfo.type === 'date' || colInfo.type === 'datetime' || colInfo.type === 'decimal') {
        const pfse = getPageFilterSorterErrors(pageState, table);
        const origFilters: IPageFilter[] = pfse.filters;
        const fromId = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_from`;
        const toId = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_to`;

        const fromValObj = origFilters.find((f) => f.id === fromId);
        const toValObj = origFilters.find((f) => f.id === toId);

        const fromError = pfse.filterErrors[fromId];
        const toError = pfse.filterErrors[toId];
        if (colInfo.type === 'date' || colInfo.type === 'datetime') {
            return <div className="flex flex-row gap-2">
                <div>
                    <DatePicker selectsMultiple={null} selected={fromValObj?.val ? moment(fromValObj.val).toDate() : null}
                        monthsShown={2} isClearable={true} showYearDropdown={false} showMonthDropdown={false} dateFormat="yyyy-MM-dd" placeholderText={colInfo.field + ' from'}
                        onChange={(date) => {
                    stdOnChange(pageState, colInfo, table, date?moment(date as any).format('YYYY-MM-DD'):null, fromId, fromValObj, '>=');
                    }}></DatePicker>
                </div>
                <div>
                    <DatePicker selectsMultiple={null} selected={toValObj?.val ? moment(toValObj.val).toDate() : null}
                        monthsShown={2} isClearable={true} showYearDropdown={false} showMonthDropdown={false} dateFormat="yyyy-MM-dd" placeholderText={colInfo.field + '  to'}
                        onChange={(date) => {
                    stdOnChange(pageState, colInfo, table, date?moment(date as any).format('YYYY-MM-DD'):null, toId, toValObj, '<');
                    }}></DatePicker>
                </div>
            </div>;
        }
        return <div className="flex flex-row gap-2">
            <input type="text" className="form-control bg-light border-0 small" placeholder={colInfo.field + ' from'} style={{ border: fromError ? '2px solid red' : 'black' }}
                value={fromValObj?.val || ''} name={colInfo.field} onChange={e => {
                    stdOnChange(pageState, colInfo, table, e.target.value, fromId, fromValObj, '>=');
                }} />
            <input type="text" className="form-control bg-light border-0 small" placeholder={colInfo.field + ' to'} style={{ border: toError ? '2px solid red' : 'black' }}
                value={toValObj?.val || ''} name={colInfo.field} onChange={e => {
                    stdOnChange(pageState, colInfo, table, e.target.value, toId, toValObj, '<');
                }} />
        </div>;
    }
    if (colInfo.type === 'string') {
        return genericCustomerHeaderFilterFuncForString(pageState, colInfo, table);
    }
    return null;
}

export function genericCustomerHeaderFilterFuncForString(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames) {
    const { pageProps, setPageProps } = pageState;
    const pfse = getPageFilterSorterErrors(pageState, table);
    const origFilters: IPageFilter[] = pfse.filters;
    const id = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_string_eq`;
    const valObj = origFilters.find((f) => f.id === id);
    const error = pfse.filterErrors[id];
    return <div className="flex flex-row gap-2">
        <input type="text" className="form-control bg-light border-0 small" placeholder={colInfo.field} style={{ border: error ? '2px solid red' : 'black' }}
            value={valObj?.val || ''} name={colInfo.field} onChange={e => {
                stdOnChange(pageState, colInfo, table, e.target.value, id, valObj, 'like');
            }} />
    </div>;
}


export function customHeaderFilterFuncWithHouseIDLookup(mainCtx: IPageRelatedState, pageState: IPageState, colInfo: IDBFieldDef, table: TableNames): React.JSX.Element | null {
    const { pageProps, setPageProps } = pageState;
    const forceUpdateFilterVals = () => {
        setPageProps({ ...pageProps, reloadCount: (pageProps.reloadCount || 0) + 1 });
    }
    if (colInfo.field === 'houseID') {
        const allHouses = mainCtx.getAllForeignKeyLookupItems('houseInfo');
        const items: IEditTextDropdownItem[] = allHouses.map(h => {
            return {
                label: h.address as string,
                value: h.houseID,
    
            }
        })
        const allItm: IEditTextDropdownItem[] = [{
            label: 'All',
            value: '',
        }];
        const all = allItm.concat(items);
        return <div>
            <GrkEditableDropdown items={all}
                onSelectionChanged={async (item) => {
                    const id = `CUST_FILTER_${table}_${colInfo.field}_HIDDX`;
                    let newFil: IPageFilter[] = [
                        {
                            id,
                            table,
                            field: 'houseID',
                            op: '=',
                            val: item.value,
                            valDescUIOnly: item.label,
                        }
                    ];
                    if (!item.value) {
                        newFil = [];
                    }
                    const pfse = getPageFilterSorterErrors(pageState, table);
                    const origFilters: IPageFilter[] = pfse.filters;
                    //const origFilters: IPageFilter[] = get(pageProps.pagePropsTableInfo, [table, 'filters']) || [];
                    const newFilters = origFilters.filter(f => f.id !== id).concat(newFil);
                    pfse.filters = newFilters;
                    //set(pageProps.pagePropsTableInfo, [table, 'filters'], newFilters);
                    forceUpdateFilterVals();
                }}
            ></GrkEditableDropdown>
        </div>
    }
    return genericCustomHeaderFilterFunc(pageState, colInfo, table);
}