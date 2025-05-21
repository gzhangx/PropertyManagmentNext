import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { GenericDropdown, IEditTextDropdownItem, IGenericDropdownProps } from './GenericDropdown'



interface IEditTextDropdownProps extends IGenericDropdownProps {    
    formatDisplay?: (itm: IEditTextDropdownItem) => string;    
}

export function EditTextDropdown(props: IEditTextDropdownProps) {
    const opts = props.opts || {};
        
    
    return <GenericDropdown {...props} 
        opts={opts}
    >
    </GenericDropdown>
}