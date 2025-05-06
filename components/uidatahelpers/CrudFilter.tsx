import { useState } from "react";
import { TagsInput } from "../generic/TagsInput";
import { IPageFilter, IPageState, SQLOPS, TableNames } from "../types";
import { getOriginalFilters } from "./defs/util";

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
    return <TagsInput tags={getOriginalFilters(props.pageState, props.table)}
        displayTags={tag => {
            return `${tag.field} ${tag.op} ${tag.val}`;
        }}
        onTagAdded={t => {
            if (workingOnFilterIndex < 0) {
                                                    if (!pageProps.pagePropsTableInfo[table]) {
                                                        pageProps.pagePropsTableInfo[table] = {
                                                            filters: [],
                                                            sorts: [],
                                                        };
                                                    }
                                                    pageProps.pagePropsTableInfo[table].filters.push({
                                                        id: uuid.v1(),
                                                        field: t,
                                                        op: '' as SQLOPS,
                                                        val: '',
                                                        table,
                                                    });
                                                    setWorkingOnFilterIndex(pageProps.pagePropsTableInfo[table].filters.length - 1);
                                                    forceUpdatePageProps();
                                                    return;
                                                }
                                                const lastFilter = pageProps.pagePropsTableInfo[table].filters[workingOnFilterIndex];
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
            pageProps.pagePropsTableInfo[table].filters = pageProps.pagePropsTableInfo[table].filters.filter(f => f.id !== t.id);
            forceUpdatePageProps();
        }}
    ></TagsInput>
}