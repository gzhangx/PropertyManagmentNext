import { useState, Dispatch, SetStateAction } from 'react';
import { GenericDropdown, IGenericDropdownProps } from './GenericDropdown'

export interface IEditTextDropdownItem {
    label: string;
    value?: string;
}

interface IEditTextDropdownProps extends IGenericDropdownProps {    
    items: IEditTextDropdownItem[];
    onSelectionChanged: (itm:IEditTextDropdownItem) => void;
    selected?: IEditTextDropdownItem;
    formatDisplay?: (IEditTextDropdownItem) => string;    
}

export function EditTextDropdown(props: IEditTextDropdownProps) {
    const opts = props.opts || {};
    const [oselected, osetSelected] = useState<IEditTextDropdownItem>(null);    
    if (!opts.setSelected) {        
        opts.selected = oselected;
        opts.setSelected = osetSelected;
    }

    let setTo = null;
    if (!opts.selected) {
        if (props.items.length) {
            setTo = (props.items[0])
        }
    }
    if (props.selected) {
        setTo = props.selected;        
    }
    if (setTo) {
        opts.setSelected(setTo);
        props.onSelectionChanged(setTo);
    }
   
    return <GenericDropdown {...props}        
        opts={opts}
    >
    </GenericDropdown>
}