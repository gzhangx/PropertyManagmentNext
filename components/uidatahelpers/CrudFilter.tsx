import { useEffect, useRef, useState } from "react";
import { TagsInput } from "../generic/TagsInput";
import { IDBFieldDef, IFullTextSearchPart, IPageFilter, IPageState, ReactSetStateType, SQLOPS, TableNames } from "../types";
import { getPageFilterSorterErrors } from "./defs/util";

import * as uuid from 'uuid';
import { usePageRelatedContext } from "../states/PageRelatedState";
import moment from "moment";

export interface ICrudTagFilterProps {
    pageState: IPageState;
    columnInfo: IDBFieldDef[];
    table: TableNames;    
    forceUpdatePageProps: () => void;
    mode: 'fullText' | 'fieldValue';
    setMode: ReactSetStateType<'fullText' | 'fieldValue'>;
    setFullTextSearchInTyping: ReactSetStateType<IFullTextSearchPart>;
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

            valDescUIOnly: '',
        }
    }
    const mainCtx = usePageRelatedContext();
    const [workingOnFilter, setWorkingOnFilter] = useState<IPageFilter>(getEmptyFilter());
    const { table, pageState, forceUpdatePageProps } = props;
    const { pageProps } = pageState;
    const pageFilterSortErrors = getPageFilterSorterErrors(pageState, table);
    

    //edit drop props
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showAllOptions, setShowAllOptions] = useState(false);

    const [curInputText, setCurInputText] = useState('');
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const [modeSelState, setModeSelState] = useState<DropdownSimpleState>({
        show: false,
        text: 'F',
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isTargetInDOM = document.body.contains(event.target as Node);
            if (!isTargetInDOM) {
                return;
            }
            let clickInsideText = false;
            if (inputRef.current && inputRef.current.contains(event.target)) {
                clickInsideText = true;                
            }
            let clickInsideSelect = false;
            if (listRef.current && listRef.current.contains(event.target)) {
                clickInsideSelect = true;
            }

            if (!clickInsideText && !clickInsideSelect) {
                setIsOpen(false);
                setHighlightedIndex(-1);
                setShowAllOptions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    
    const onTagAdded = (t: EditItem) => {
        if (!workingOnFilter.id) {
            workingOnFilter.id = uuid.v1();
            workingOnFilter.field = t.value;
            const field = props.columnInfo.find(c => c.field === t.value);
            if (field.foreignKey) {
                workingOnFilter.op = '=';
            } else if (field.type === 'string') {
                workingOnFilter.op = 'like';
            }
            setWorkingOnFilter({ ...workingOnFilter });
            return;
        }
        if (!workingOnFilter.op) {
            workingOnFilter.op = t.value as SQLOPS;
            setWorkingOnFilter({ ...workingOnFilter });
            return;
        }
        if (!workingOnFilter.val) {
            const field = props.columnInfo.find(c => c.field === workingOnFilter.field);            
            workingOnFilter.val = t.value;
            workingOnFilter.valDescUIOnly = t.label;
            if (field.type === 'string') {
                workingOnFilter.val = `%${t.value}%`;
            }            
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
                const originalList = ['=', '!=', '<', '<=', '>', '>=', 'like'];
                const field = props.columnInfo.find(c => c.field === workingOnFilter.field);            
                let listToUse = originalList;
                if (field.type === 'decimal' || field.type === 'int') {
                    listToUse = listToUse.filter(x => x !== 'like');
                }                
                return listToUse.map(label => {
                    return {
                        label,
                        value: label,
                    }
                });
            case 'val':
                if (workingOnFilter.field === 'houseID') {
                    const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []).map(data=>data.data);
                    const items = allHouses.map(h => {
                        return {
                            label: h.address as string,
                            value: h.houseID as string,
                        
                        }
                    });
                    return items;
                } 
                if (workingOnFilter.field === 'workerID') {
                    const allWkrs = (mainCtx.getAllForeignKeyLookupItems('workerInfo') || []).map(data=>data.data);
                    const items = allWkrs.map(h => {
                        return {
                            label: h.workerName as string || '',
                            value: h.workerID as string,

                        }
                    });
                    return items;
                }
                return [];
        }
    }
    let canShowFilterSel = true;
    let filterValIsSelection = false;
    if (curSelState === 'val') {
        switch (workingOnFilter.field) {
            case 'houseID':
            case 'workerID':
                filterValIsSelection = true;
                break;
            default:
                canShowFilterSel = false;
        }        
    }

    const handleSelect = (option: EditItem) => {
        //setIsOpen(true);
        setHighlightedIndex(-1);
        //props.onSelectionChanged(option);
        onTagAdded(option);
        setCurInputText('');
        inputRef.current.focus();
        //setShowAllOptions(true);
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

    const showFilterSelect = canShowFilterSel && isOpen && filteredOptions;

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
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '2px',
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
                placeholder={ props.mode === 'fullText'? 'Enter full text search':"Enter field/value"}
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
                if (props.mode === 'fullText') {
                    const sch = stringToFullTextSearchPart(e.target.value);
                    props.setFullTextSearchInTyping(sch);
                    return;
                }
                }}
                onClick={() => {
                    if (props.mode === 'fullText') {
                        return;
                    }
                    setIsOpen(true);
                    setShowAllOptions(true);
                }}
                onKeyDown={(event) => {
                    if (props.mode === 'fullText') {
                        if (event.key === 'Enter') {
                            const sch = stringToFullTextSearchPart((event.target as HTMLInputElement).value);
                            pageFilterSortErrors.fullTextSearchs.push(sch);
                            setCurInputText('');
                            forceUpdatePageProps();
                        } 
                        return;
                    }
                    if (curSelState === 'fields' || curSelState === 'op') {
                        handleKeyDown(event);
                        return;
                    }
                if (event.key === 'Enter') {
                    if (filterValIsSelection) return;
                        event.preventDefault();
                        const tagContent = (event.target as HTMLInputElement).value.trim();

                        if (tagContent !== '') {
                            onTagAdded({
                                label: tagContent,
                                value: tagContent,
                            });
                            setCurInputText('');
                            props.setFullTextSearchInTyping(prev => ({
                                ...prev,
                                val: '',
                            }));
                        }
                    }
                    return;
                }
            }
            />
            
            <ul ref={listRef} className="gg-editable-dropdown-list" style={{ display: showFilterSelect?'inline-block':'none'}}>
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
            </div>
        </>


    return <>
        <div>
        <DropdownSimple state={modeSelState} setState={setModeSelState}>
        <>
                            <div className="dropdown-header">Mode:</div>
                    <a className="dropdown-item" href="#" onClick={e => {
                        e.preventDefault();
                        props.setMode('fullText');
                        setModeSelState(prev => ({
                                ...prev,
                                show: false,
                            }))
                            }}>Full Text Search</a>
                            <div className="dropdown-divider"></div>
                            <a className="dropdown-item" href="#" onClick={e => {
                        e.preventDefault();
                        props.setMode('fieldValue');
                        setModeSelState(prev => ({
                            ...prev,
                            show: false,
                        }))
                            }}>Field Search</a>
                        </>
            </DropdownSimple>
            </div>
        <TagsInput tags={pageFilterSortErrors.filters.concat(pageFilterSortErrors.fullTextSearchs as unknown as IPageFilter[])}
            displayTags={tag => {
                return `${tag.field || ''} ${tag.op} ${tag.valDescUIOnly || tag.val}`;
            }}
            onTagAdded={()=>{}}
            onTagRemoved={t => {
                pageFilterSortErrors.filters = pageFilterSortErrors.filters.filter(f => f.id !== t.id);
                pageFilterSortErrors.fullTextSearchs = pageFilterSortErrors.fullTextSearchs.filter(f => f.id !== t.id);
                forceUpdatePageProps();
            }}                                    
                custInputUIElement={custInputUIElement}
        ></TagsInput>    
    </>
}


interface DropdownSimpleState {
    show: boolean;
    text: string;
}
function DropdownSimple(props: {
    state: DropdownSimpleState;
    setState: ReactSetStateType<DropdownSimpleState>;
    children: React.JSX.Element;
}) {
    const { state, setState } = props;
    const className = `dropdown-menu shadow animated--fade-in ${state.show && 'show'}`;
    return <div className="dropdown no-arrow">
        <a className="dropdown-toggle" href="#" role="button"
            onBlur={
                () => {
                    //</div>setState(prev => ({
                    //    ...prev,
                    //    show: false,
                    //}))
                }
            }
            onClick={e => {
                //e.preventDefault();
                setState(prev => ({
                    ...prev,
                    show: !prev.show,
                }));
            }}
            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400">{ state.text}</i>
        </a>
        <div className={className}
            aria-labelledby="dropdownMenuLink">
            {
                props.children
            }
        </div>
    </div>
}


function isNumeric(str: string) {
    return !isNaN(str as unknown as number) && // Use Type conversion to determine if it is a number
           !isNaN(parseFloat(str)) 
}
  
function stringToFullTextSearchPart(str: string): IFullTextSearchPart {
    const res: IFullTextSearchPart = {
        val: uuid.v1(),
        id: '',
        op: '',
        type: 'string',
    };

    res.val = str;
    for (const op of ['=', '>', '<']) {
        if (str.startsWith(op)) {
            res.op = op as '=';
            res.val = str.substring(op.length);
            if (moment(res.val).isValid()) {
                res.type = 'date';
            } else if (isNumeric(res.val)) {
                res.type = 'number';
            }
            break;
        }
    }

    return res;
}