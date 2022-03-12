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
    /*    
    const dropDownControl = (show: boolean) => {
        return <div className="input-group">
            <input type="text" className="form-control bg-light border-0 small" placeholder={opts.placeHolder || ''}
                aria-label="Search" aria-describedby="basic-addon2"
                value={opts.selected?opts.selected.displayName||opts.selected.value:''}
            />
            <div className="input-group-append">
                <button className="btn btn-primary" type="button">
                    <i className={show ? 'far fa-arrow-alt-circle-down' : "fas far fa-arrow-alt-circle-right"}></i>
                </button>
            </div>
        </div>
    }
    opts.getDropDownControl = dropDownControl;
    */
    return <GenericDropdown {...props}        
        opts={opts}
    >
    </GenericDropdown>
}