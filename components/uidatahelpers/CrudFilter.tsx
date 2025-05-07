import { useEffect, useRef, useState } from "react";
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
    function getEmptyFilter(): IPageFilter {
        return {
            id: '',
            field: '',
            op: '' as SQLOPS,
            val: '',
            table: props.table,
        }
    }
    const [workingOnFilter, setWorkingOnFilter] = useState<IPageFilter>(getEmptyFilter());
    const { table, pageState, forceUpdatePageProps } = props;
    const { pageProps } = pageState;
    const pageFilterSortErrors = getPageFilterSorterErrors(pageState, table);
    

    //edit drop props
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showAllOptions, setShowAllOptions] = useState(false);

    const [curInputText, setCurInputText] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target)) {
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    setShowAllOptions(false);
                }
            };
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    
    const onTagAdded = t => {
        if (!workingOnFilter.id) {
            workingOnFilter.id = uuid.v1();
            workingOnFilter.field = t;
            setWorkingOnFilter({ ...workingOnFilter });
            return;
        }
        if (!workingOnFilter.op) {
            workingOnFilter.op = t as SQLOPS;
            setWorkingOnFilter({ ...workingOnFilter });
            return;
        }
        if (!workingOnFilter.val) {
            workingOnFilter.val = t;
            pageFilterSortErrors.filters.push(workingOnFilter);
            setWorkingOnFilter(getEmptyFilter());
            forceUpdatePageProps();
            return;
        }
    };

    function getCurSelState(): ('fields' | 'op' | 'val') {
        if (!workingOnFilter.id) return 'fields';
        if (!workingOnFilter.field) return 'fields';
        if (!workingOnFilter.op) return 'op';
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
                return [];
        }
    }

    const handleSelect = (option: EditItem) => {
        setCurInputText(option.label);
        setIsOpen(false);
        setHighlightedIndex(-1);
        setShowAllOptions(false);
        //props.onSelectionChanged(option);
        onTagAdded(option.value);
        setCurInputText('');
        inputRef.current.focus();
    };
    const options = getCurSelection();
    const filteredOptions = showAllOptions
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(curInputText.toLowerCase())
        );
    
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
        } else if (e.key === 'Enter' && filteredOptions.length > 0) {
            e.preventDefault();
            handleSelect(filteredOptions[0]);
        }
        else if (e.key === 'Escape') {
            setIsOpen(false);
            setHighlightedIndex(-1);
            setShowAllOptions(false);
        } else {
            setShowAllOptions(false);
        }
    };

    const custInputUIElement = <>
        <style jsx>{`
            .tag-input-wrapper {
                display: flex;
            align-items: center;
            padding: 1rem;
    }
            .tag-list {
                display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
    }
            .tag {
                display: flex;
            align-items: center;
            background-color: #3b82f6;
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
    }`}
        </style>
        <div ref={containerRef} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
            }}>

            {
                workingOnFilter.field && <>
                    {
                        [workingOnFilter.field, workingOnFilter.op].filter(x => x).map((tag, index) => {
                            return (
                                <span key={index} style={{
                                    background: '#e0e0e0',
                                    padding: '5px 10px',
                                    borderRadius: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    {tag}
                                    <button style={{
                                        background: '#ff4d4d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
 onClick={() => {
                                        // Call the onTagRemoved function passed as a prop
                                        switch (index) {
                                            case 0:
                                                setWorkingOnFilter(getEmptyFilter());
                                                break;
                                            case 1:
                                                setWorkingOnFilter({
                                                    ...workingOnFilter,
                                                    op: '' as SQLOPS
                                                })
                                                break;
                                        }
                                    }}>X</button>
                                </span>
                            );
                        })
                    }
                    </>
                }
                </div>
            <input type="text"
                ref={inputRef}
                placeholder="Enter tag name1"
                style={{
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    outline: 'none',
                    fontSize: '16px',
                    maxWidth: '800px'
                }}
            value={curInputText}
            onChange={e => {
                setCurInputText(e.target.value);
                }}
                onClick={() => {
                    setIsOpen(true);
                    setShowAllOptions(true);
                }}
            onKeyDown={(event) => {
                    if (curSelState === 'fields' || curSelState === 'op') {
                        handleKeyDown(event);
                        return;
                    }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const tagContent = (event.target as HTMLInputElement).value.trim();

                        if (tagContent !== '') {
                            onTagAdded(tagContent);
                            setCurInputText('');
                        }
                    }
                    return;
                }
            }
            />
            {
            isOpen && filteredOptions && (
                <ul ref={listRef} className="gg-editable-dropdown-list">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => {
                            const { label, value } = option;
                        
                            return (
                                <li
                                    key={value}
                                    style={{ display: 'block' }}
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
            }
            </div>
        </>

    



    return <>
        
        <TagsInput tags={pageFilterSortErrors.filters}
            displayTags={tag => {
                return `${tag.field} ${tag.op} ${tag.val}`;
            }}
            onTagAdded={onTagAdded}
            onTagRemoved={t => {
                pageFilterSortErrors.filters = pageFilterSortErrors.filters.filter(f => f.id !== t.id);
                forceUpdatePageProps();
            }}                                    
                custInputUIElement={custInputUIElement}
        ></TagsInput>    
    </>
}