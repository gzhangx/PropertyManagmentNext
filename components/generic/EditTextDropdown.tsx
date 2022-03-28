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
    const [selected, setSelected] = useState<IEditTextDropdownItem>(null);    
    
    opts.selected = selected;
    opts.setSelected = setSelected;
    useEffect(() => {
        let setTo: IEditTextDropdownItem = props.items.find(i=>i.selected);
        if (!setTo && props.items.length) {
            setTo = (props.items[0])
        }
        if (setTo) {
            setSelected(setTo);
            props.onSelectionChanged(setTo);
        }
    },[])
    
   
    return <GenericDropdown {...props}        
        opts={opts}
    >
    </GenericDropdown>
}