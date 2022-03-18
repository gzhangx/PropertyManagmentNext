
import { useState,  } from 'react';
import { GenericMultiSelectDropdown, IGenericMultiSelectDropdownProps } from '../generic/GenericMultipleSelectDropdown'
import { IEditTextDropdownItem} from '../generic/EditTextDropdown'

interface IMultiSelectItem extends IEditTextDropdownItem {
    selected: boolean;
}
export function CheckBoxMultiSelect(props: IGenericMultiSelectDropdownProps) {
    const items = props.items as IMultiSelectItem[];
    const [selected, setSelected] = useState<IMultiSelectItem[]>([]);

    return <GenericMultiSelectDropdown selected={selected}
        setSelected={setSelected}
        items={items}
        renderItem={(item: IMultiSelectItem, prp: IGenericMultiSelectDropdownProps, key: number) => {
            const clrClass = `icon-circle bg-primary`;
            const isSelected = selected.find(s => s.value === item.value);
            const iconClass = `fas text-white ${isSelected?'far fa-check-square':'far fa-square'}`            
            return <a className="dropdown-item d-flex align-items-center" href="#" key={key} onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                if (isSelected) {
                    setSelected(selected.filter(s => s.value !== item.value));
                } else {
                    setSelected([...selected, item]);
                }
            }}>
                <div className="mr-3">
                    <div className={clrClass}>
                        <i className={iconClass}></i>
                    </div>
                </div>
                <div>
                    {item.label}
                </div>
            </a>
        }}
        renderSelected={
            (items: IMultiSelectItem[], show:boolean) => {
                return <div>{ items.length}</div>
            }
        }
    ></GenericMultiSelectDropdown>
}