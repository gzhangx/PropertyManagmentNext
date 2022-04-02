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

    console.log(setTo);
    useEffect(() => {          
        setSelected(setTo);
    }, [setTo && (setTo.value || setTo.label)]);
    opts.selected = selected;
    opts.setSelected = setSelected;
    
    
   
    return <GenericDropdown {...props}        
        opts={opts}
    >
    </GenericDropdown>
}