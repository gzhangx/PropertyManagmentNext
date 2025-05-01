import { get, set } from 'lodash'
import { IDBFieldDef, IPageFilter, IPageState, TableNames } from "../../types";
import moment from 'moment';


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

function stdOnChange(pageState: IPageState, colInfo: IDBFieldDef, table: TableNames, e: React.ChangeEvent<HTMLInputElement>, id, valObj?: IPageFilter) {
    const { pageProps } = pageState;
    const origFilters: IPageFilter[] = getOriginalFilters(pageState, table);
    if (valObj) {
        valObj.val = e.target.value;
        if (!e.target.value) {
            origFilters.splice(origFilters.indexOf(valObj), 1);
            set(pageProps, [table, 'filters'], origFilters);
        }        
    } else {
        origFilters.push({ id, field: colInfo.field, val: e.target.value, op: '>=', table });
        set(pageProps, [table, 'filters'], origFilters);
    }


    if (!isValid(e.target.value, colInfo)) {
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
        return <div className="flex flex-row gap-2">
            <input type="text" className="form-control bg-light border-0 small" placeholder={colInfo.field + ' from'} style={{ border: fromError ? '2px solid red' : 'black' }}
                value={fromValObj?.val || ''} name={colInfo.field} onChange={e => {
                    stdOnChange(pageState, colInfo, table, e, fromId, fromValObj);
                }} />
            <input type="text" className="form-control bg-light border-0 small" placeholder={colInfo.field + ' to'} style={{ border: toError ? '2px solid red' : 'black' }}
                value={toValObj?.val || ''} name={colInfo.field} onChange={e => {
                    stdOnChange(pageState, colInfo, table, e, toId, toValObj);
                }} />
        </div>;
    }
    return null;
}