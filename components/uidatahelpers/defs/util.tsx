import { get, set } from 'lodash'
import { IDBFieldDef, IPageFilter, IPageState, SQLOPS, TableNames } from "../../types";
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

export function getOriginalFilters(pageState: IPageState, table: TableNames): IPageFilter[] {
    const { pageProps, setPageProps } = pageState;
    const origFilters: IPageFilter[] = get(pageProps, [table, 'filters']) || [];
    return origFilters;
}

function isValid(val: string, colInfo: IDBFieldDef): boolean {
    if (colInfo.type === 'date' || colInfo.type === 'datetime') {
        return moment(val).isValid();
    } else if (colInfo.type === 'decimal') {
        return !isNaN(Number(val));
    } 
    return true;
}

function stdOnChange(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames, val: string, id, valObj: IPageFilter, op: SQLOPS) {
    const { pageProps } = pageState;
    const origFilters: IPageFilter[] = getOriginalFilters(pageState, table);
    if (valObj) {
        valObj.val = val;
        if (!val) {            
            origFilters.splice(origFilters.indexOf(valObj), 1);
            set(pageProps, [table, 'filters'], origFilters);
        }        
    } else {        
        origFilters.push({ id, field: colInfo.field, val, op, table });
        set(pageProps, [table, 'filters'], origFilters);
    }


    if (val && !isValid(val, colInfo)) {
        set(pageProps, [table, 'filterErrors', id], true);
        return updateFilterValsNoSubmit(pageState);
    }
    set(pageProps, [table, 'filterErrors', id], false);
    forceUpdateFilterVals(pageState);
}
export function genericCustomHeaderFilterFunc(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames): (React.JSX.Element | null) {
    const { pageProps, setPageProps } = pageState;
    if (colInfo.type === 'date' || colInfo.type === 'datetime' || colInfo.type === 'decimal') {
        const origFilters: IPageFilter[] = getOriginalFilters(pageState, table);
        const fromId = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_from`;
        const toId = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_to`;

        const fromValObj = origFilters.find((f) => f.id === fromId);
        const toValObj = origFilters.find((f) => f.id === toId);

        const fromError = get(pageProps, [table, 'filterErrors', fromId]);
        const toError = get(pageProps, [table, 'filterErrors', toId]);
        if (colInfo.type === 'date' || colInfo.type === 'datetime') {
            return <div className="flex flex-row gap-2">
                <div>
                    <DatePicker selectsMultiple={null} selected={fromValObj?.val ? moment(fromValObj.val).toDate() : null} onChange={(date) => {
                    stdOnChange(pageState, colInfo, table, date?moment(date as any).format('YYYY-MM-DD'):null, fromId, fromValObj, '>=');
                    }}></DatePicker>
                </div>
                <div>
                    <DatePicker selectsMultiple={null} selected={toValObj?.val ? moment(toValObj.val).toDate() : null} onChange={(date) => {
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
    const origFilters: IPageFilter[] = getOriginalFilters(pageState, table);
    const id = `${CUST_FILTER_HEADER}_${table}_${colInfo.field}_string_eq`;
    const valObj = origFilters.find((f) => f.id === id);
    const error = get(pageProps, [table, 'filterErrors', id]);
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
                        }
                    ];
                    if (!item.value) {
                        newFil = [];
                    }
                    const origFilters: IPageFilter[] = get(pageProps, [table, 'filters']) || [];
                    const newFilters = origFilters.filter(f => f.id !== id).concat(newFil);
                    set(pageProps, [table, 'filters'], newFilters);
                    forceUpdateFilterVals();
                }}
            ></GrkEditableDropdown>
        </div>
    }
    return genericCustomHeaderFilterFunc(pageState, colInfo, table);
}