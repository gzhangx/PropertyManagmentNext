import { useState } from "react";
import { TagsInput } from "../generic/TagsInput";
import { IPageFilter, IPageState, SQLOPS, TableNames } from "../types";
import { getOriginalFilters, getPageFilterSorterErrors } from "./defs/util";

import * as uuid from 'uuid';

export interface ICrudTagFilterProps {
    pageState: IPageState;
    table: TableNames;    
    forceUpdatePageProps: () => void;
}

export function CrudFilter(props: ICrudTagFilterProps) {
    const [workingOnFilterIndex, setWorkingOnFilterIndex] = useState(-1);
    const { table, pageState, forceUpdatePageProps } = props;
    const { pageProps } = pageState;
    const pageFilterSortErrors = getPageFilterSorterErrors(pageState, table);
    return <TagsInput tags={pageFilterSortErrors.filters}
        displayTags={tag => {
            return `${tag.field} ${tag.op} ${tag.val}`;
        }}
        onTagAdded={t => {
            if (workingOnFilterIndex < 0) {                
                pageFilterSortErrors.filters.push({
                    id: uuid.v1(),
                    field: t,
                    op: '' as SQLOPS,
                    val: '',
                    table,
                });
                setWorkingOnFilterIndex(pageFilterSortErrors.filters.length - 1);
                forceUpdatePageProps();
                return;
            }
            const lastFilter = pageFilterSortErrors.filters[workingOnFilterIndex];
            if (!lastFilter.op) {
                lastFilter.op = t as SQLOPS;
                forceUpdatePageProps();
                return;
            }
            if (!lastFilter.val) {
                lastFilter.val = t;
                setWorkingOnFilterIndex(-1);
                forceUpdatePageProps();
                return;
            }
        }}
        onTagRemoved={t => {
            pageFilterSortErrors.filters = pageFilterSortErrors.filters.filter(f => f.id !== t.id);
            forceUpdatePageProps();
        }}
    ></TagsInput>
}