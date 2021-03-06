import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { GenericDropdown, IGenericDropdownProps } from './GenericDropdown'

export interface IEditTextDropdownItem {
    label: string;
    value?: any;
    selected?: boolean;
}

interface IEditTextDropdownProps extends IGenericDropdownProps {    
    items: IEditTextDropdownItem[];
    onSelectionChanged: (itm:IEditTextDropdownItem) => void;
    formatDisplay?: (IEditTextDropdownItem) => string;    
}

export function EditTextDropdown(props: IEditTextDropdownProps) {
    const opts = props.opts || {};

    let setTo: IEditTextDropdownItem = props.items.find(i=>i.selected);
    if (!setTo && props.items.length) {
        setTo = (props.items[0])
    }
    
    const [selected, setSelected] = useState<IEditTextDropdownItem>(setTo);
    if (!opts.setSelected) {
        opts.selected = selected;
        opts.setSelected = setSelected;
    }
    useEffect(() => {          
        opts.setSelected(setTo);
        if (setTo) props.onSelectionChanged(setTo);
    }, [setTo && props.formatDisplay && props.formatDisplay(setTo)]);    
    
    
   
    return <GenericDropdown {...props}        
        opts={opts}
    >
    </GenericDropdown>
}