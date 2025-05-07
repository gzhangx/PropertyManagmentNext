import { useRef, useState } from "react";
import { TagsInput } from "../generic/TagsInput";
import { IDBFieldDef, IPageFilter, IPageState, SQLOPS, TableNames } from "../types";
import { getOriginalFilters, getPageFilterSorterErrors } from "./defs/util";

import * as uuid from 'uuid';

export interface ICrudTagFilterProps {
    pageState: IPageState;
    columnInfo: IDBFieldDef[];
    table: TableNames;    
    forceUpdatePageProps: () => void;
}


interface EditItem {
    label: string;
    value: string;
}
export function CrudFilter(props: ICrudTagFilterProps) {
    const [workingOnFilterIndex, setWorkingOnFilterIndex] = useState(-1);
    const { table, pageState, forceUpdatePageProps } = props;
    const { pageProps } = pageState;
    const pageFilterSortErrors = getPageFilterSorterErrors(pageState, table);
    

    //edit drop props
    const [isOpen, setIsOpen] = useState(false);    
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showAllOptions, setShowAllOptions] = useState(false);

    const [curInputText, setCurInputText] = useState('');

    const listRef = useRef(null);

    const onTagAdded = t => {
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
    };

    function getCurSelState(): ('fields' | 'op' | 'val') {
        if (workingOnFilterIndex < 0) return 'fields';
        const lastFilter = pageFilterSortErrors.filters[workingOnFilterIndex];
        if (!lastFilter || !lastFilter.field) return 'fields';
        if (!lastFilter.op) return 'op';
        return 'val';
    }
    const curSelState = getCurSelState();
    function getCurSelection() {
        switch (getCurSelState()) {
            case 'fields':
                return props.columnInfo ? props.columnInfo.map(c => {
                    return { label: c.field, value: c.field };
                }) : [];
            case 'op':
                return ['=', '!=', '<', '<=', '>', '>=', 'like'].map(label => {
                    return {
                        label,
                        value: label,
                    }
                });
            case 'val':
                return null;
        }
    }

    const handleSelect = (option: EditItem) => {
        setCurInputText(option.label);
            setIsOpen(false);
            setHighlightedIndex(-1);
            setShowAllOptions(false);
            //props.onSelectionChanged(option);
        };
    const options = getCurSelection();
    const filteredOptions = showAllOptions
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(curInputText.toLowerCase())
        );
    console.log(filteredOptions, 'filteredopts---->', curInputText)
    const custAfterUIElement = 
        isOpen && filteredOptions && (
            <ul ref={listRef} className="gg-editable-dropdown-list">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => {
                        const { label, value } = option;
                        
                        return (
                            <li
                                key={value}                                
                                style={{display:'block'}}
                                onClick={() => handleSelect(option)}
                                className={`${index === highlightedIndex ? 'gg-editable-dropdown-list-block highlighted' : ''
                                    }`}
                            >
                                {label}
                            </li>
                        )
                    })
                ) : (
                    <li className="no-options">No options found</li>
                )}
            </ul>
        )    

    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
            const maxIndex = filteredOptions.length - 1;
            let newIndex = highlightedIndex;

            if (e.key === 'ArrowDown') {
                newIndex = highlightedIndex < maxIndex ? highlightedIndex + 1 : 0;
            } else if (e.key === 'ArrowUp') {
                newIndex = highlightedIndex > 0 ? highlightedIndex - 1 : maxIndex;
            }

            setHighlightedIndex(newIndex);

            // Scroll highlighted item into view
            if (newIndex >= 0 && listRef.current) {
                const highlightedItem = listRef.current.children[newIndex];
                highlightedItem.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            handleSelect(filteredOptions[highlightedIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            setShowAllOptions(false);
        } else {
            setShowAllOptions(false);
        }
    };


    return <TagsInput tags={pageFilterSortErrors.filters}
        displayTags={tag => {
            return `${tag.field} ${tag.op} ${tag.val}`;
        }}
        onTagAdded={onTagAdded}
        onTagRemoved={t => {
            pageFilterSortErrors.filters = pageFilterSortErrors.filters.filter(f => f.id !== t.id);
            forceUpdatePageProps();
        }}
        custHandleKeyDown={(event) => {
            if (curSelState === 'fields' || curSelState === 'op') {
                handleKeyDown(event);
                return true;
            }
            if (event.key === 'Enter') {                
                event.preventDefault();                
                const tagContent = (event.target as HTMLInputElement).value.trim();
                
                if (tagContent !== '') {
                    onTagAdded(tagContent);
                    setCurInputText('');
                }
            }
            return true;
        }}
        custHandleClick={e => {
            setIsOpen(true);
            setShowAllOptions(true);
        }}
        curInputText={curInputText}
        setCurInputText={setCurInputText}
        custAfterUIElement={custAfterUIElement}
    ></TagsInput>
}