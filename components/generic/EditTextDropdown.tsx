import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { GenericDropdown, IGenericDropdownProps } from './GenericDropdown'

export interface IEditTextDropdownItem {
    label: string;
    value?: string | number;
}

interface IEditTextDropdownProps extends IGenericDropdownProps {    
    items: IEditTextDropdownItem[];
    onSelectionChanged: (itm:IEditTextDropdownItem) => void;
    selected?: IEditTextDropdownItem;
    formatDisplay?: (IEditTextDropdownItem) => string;    
}

export function EditTextDropdown(props: IEditTextDropdownProps) {
    const opts = props.opts || {};
    const [selected, setSelected] = useState<IEditTextDropdownItem>(null);    
    
    opts.selected = selected;
    opts.setSelected = setSelected;
    useEffect(() => {
        let setTo = props.selected;
        if (!setTo) {
            if (props.items.length) {
                setTo = (props.items[0])
            }
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