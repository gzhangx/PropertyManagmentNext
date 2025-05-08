import { useEffect, useRef, useState } from "react";
import { IEditTextDropdownItem } from "./GenericDropdown";


export interface IGrkEditableDropdownProps {
    items: IEditTextDropdownItem[];
    onSelectionChanged: (itm: IEditTextDropdownItem) => void;
}

export default function GrkEditableDropdown(props: IGrkEditableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [showAllOptions, setShowAllOptions] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    
    const options = props.items;

    // Filter options based on input, unless showing all options
    const filteredOptions = showAllOptions
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );        

    // Handle click outside to close dropdown
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

    const getSelectedText = () => {
        const selectedItem = options.find(itm => itm.selected);
        if (!selectedItem) return '';
        return selectedItem.label || selectedItem.value;
    }
    useEffect(() => {
        setInputValue(getSelectedText());
        const selectedItem = options.find(itm => itm.selected);
        if (selectedItem) {
            props.onSelectionChanged(selectedItem);
        }
    }, [getSelectedText()])


    // Handle option selection
    const handleSelect = (option: IEditTextDropdownItem) => {
        setInputValue(option.label);
        setIsOpen(false);
        setHighlightedIndex(-1);
        setShowAllOptions(false);
        props.onSelectionChanged(option);
    };

    // Handle input change
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsOpen(true);
        setShowAllOptions(false);
        setHighlightedIndex(-1);
    };

    // Handle keyboard navigation
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
        }
    };

    return (
        <div ref={containerRef} className="gg-editable-dropdown-container">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onClick={() => {
                    setIsOpen(true);
                    setShowAllOptions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Select or type..."
                className="gg-editable-dropdown-input"
            />
            <i
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowAllOptions(!isOpen);
                    inputRef.current.focus();
                }}
                className="fas fa-chevron-down gg-editable-dropdown-icon"
            ></i>
            {isOpen && (
                <ul ref={listRef} className="gg-editable-dropdown-list">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, index) => (
                            <li
                                key={option.value || option.label}
                                onClick={() => handleSelect(option)}
                                className={`${index === highlightedIndex ? 'highlighted' : ''
                                    }`}
                            >
                                {option.label || option.value}
                            </li>
                        ))
                    ) : (
                        <li className="no-options">No options found</li>
                    )}
                </ul>
            )}
        </div>
    );
}
