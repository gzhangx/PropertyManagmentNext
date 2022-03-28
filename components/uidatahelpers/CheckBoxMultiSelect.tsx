
import { useState,  } from 'react';
import { GenericMultiSelectDropdown, IGenericMultiSelectDropdownProps } from '../generic/GenericMultipleSelectDropdown'
import { IEditTextDropdownItem} from '../generic/EditTextDropdown'

interface ICheckBoxMultiSelectProps  {
    items: IEditTextDropdownItem[];
    setSelected: (sel:IEditTextDropdownItem[]) => void;
}

export function CheckBoxMultiSelect(props: ICheckBoxMultiSelectProps) {
    const items = props.items as IEditTextDropdownItem[];
    const [selected, setSelectedInner] = useState<IEditTextDropdownItem[]>([]);

    const setSelected = (itms: IEditTextDropdownItem[]) => {
        setSelectedInner(itms);
        props.setSelected(itms);
    }
    const svgStyle = {
        display: "inline-block",
        fill: "currentColor",
        lineHeight: 1,
        stroke: "currentColor",
        strokeWidth: 0,
    };
    return <GenericMultiSelectDropdown selected={selected}
        items={items}
        renderItem={(item: IEditTextDropdownItem, prp: IGenericMultiSelectDropdownProps, key: number) => {
            const clrClass = `icon-circle bg-primary`;
            const isSelected = selected.find(s => s.value === item.value);
            const iconClass = `fas text-white ${isSelected ? 'far fa-check-square' : 'far fa-square'}`
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
            (items: IEditTextDropdownItem[], show: boolean, setShow) => {
                return <div style={
                    {
                        //outer most layer
                        position: "relative",
                        boxSizing: "border-box"
                    }
                }>
                    <div style={{
                        borderRadius: "4px",
                        borderColor: "hsl(0,0%,70%)",
                        borderStyle: "solid",
                        borderWidth: "1px",
                        display: "flex",
                        flexWrap: "wrap",
                        boxSizing: "border-box",
                    }}>
                        <div style={{
                            //items container
                            display:"flex"
                        }}>
                            {
                                items.map((item, key) => {
                                    return <div key={key} style={{
                                        //item 
                                        backgroundColor:"hsl(0,0%,90%)",
                                        borderRadius: "2px",
                                        display: "flex",
                                        margin: "2px",
                                        minWidth: '0',
                                        boxSizing:"border-box",
                                    }}>
                                        <div style={{
                                            color: "hsl(0,0%m20%)",
                                            fontSize: "85%",
                                            overflow: "hidden",
                                            padding: "3px",
                                            paddingLeft: "6px",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            boxSizing:"border-box",
                                        }}>{item.label}</div>
                                        <div ><svg height="14" width="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={{
                                            display: "inline-block",
                                            fill: "currentColor",
                                            lineHeight: 1,
                                            stroke: "currentColor",
                                            strokeWidth: 0,
                                        }}><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg></div>
                                    </div>
                                })
                            }
                        </div>
                        <div style={{
                            //indicatorContainer outer most
                            display: "flex",
                            boxSizing: "border-box",
                            flexShrink: 0,
                        }}><div aria-hidden="true" style={{
                            //indicatorContainer
                            display: "flex",
                            padding: "8px",
                            boxSizing: "border-box",
                            }} onClick={e => {
                                e.stopPropagation();
                                setSelected([]);
                                setShow(false);
                        }}>
                                <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={svgStyle}><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z"></path></svg>
                           </div>
                            <span style={{
                               //ind seperator
                               alignSelf: "stretch",
                               backgroundColor: "hsl(0,0%,80%)",
                               marginBottom: "8px",
                               marginTop: "8px",
                               width: "1px",
                               boxSizing: "border-box",
                           }}></span><div aria-hidden="true" style={{
                            //indicatorContainer
                            display: "flex",
                            padding: "8px",
                            boxSizing: "border-box",
                        }}><svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" style={svgStyle}><path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"></path></svg></div>
                        </div>
                    </div>

                </div>
                return <div>{items.length}</div>
            }
        }
    ></GenericMultiSelectDropdown>
}