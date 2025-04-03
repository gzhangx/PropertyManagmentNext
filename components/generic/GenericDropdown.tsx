import { useState, useEffect, useRef, SetStateAction, Dispatch, type JSX } from "react";

export interface IEditTextDropdownItem {
    label: string;
    value?: any; //default to label
    selected?: boolean;    
}
export interface IGenericDropdownProps {
    children?: any;
    items: IEditTextDropdownItem[];
    onSelectionChanged: (itm: IEditTextDropdownItem) => void;

    setCurDisplayValue?: (string) => void;
    curDisplayValue?: string;
    setShow?: (boolean) => void;
    show?: boolean;

    opts?: IGenericDropdownPropsOptional;
}

export interface IGenericDropdownPropsOptional {    
    defaultShow?: boolean;
    className?: string;
    placeHolder?: string;
    //selected?: any;
    //setSelected?: Dispatch<SetStateAction<any>>;
    dataFormatter?: (item: IEditTextDropdownItem, param: IItemFormatterParams, keyInd: number) => (JSX.Element | string | null);
    //getDropDownControl?: (show: boolean) => JSX.Element;
    mapItems?: (param: IItemMapperParams) => (JSX.Element | null)[];
}

export function GenericDropdown(props: IGenericDropdownProps) {
    const { children, items, } = props;
    const opts = props.opts;
    const { defaultShow, className } = opts || {};
    const [showInner, setShowInner] = useState<boolean>(defaultShow || false);
    let show = showInner;
    let setShow = setShowInner;
    if (props.setShow) {
        show = props.show;
        setShow = props.setShow;
    }
    const [curDisplayValueInner, setCurDisplayValueInner] = useState<string>('');

    let curDisplayValue = curDisplayValueInner;
    let setCurDisplayValue = setCurDisplayValueInner
    if (props.setCurDisplayValue) {
        setCurDisplayValue = props.setCurDisplayValue;
        curDisplayValue = props.curDisplayValue;
    }
    const [showByButton, setShowByButton] = useState<boolean>(false);
    //const getSelectedText = () => (props.selected ? props.selected.label || props.selected.value : '');
    const getSelectedText = () => {
        const selectedItem = items.find(itm => itm.selected);
        if (!selectedItem) return '';
        return selectedItem.label;
    }    
    const topNode = useRef<HTMLLIElement>(undefined);
    useEffect(() => {
        const clickOutside = (e: MouseEvent) => {
            if (!topNode.current) return;
            if (topNode.current.contains(e.target as Node)) {
                return;
            }
            setShow(false);
            //setCurDisplayValue(getSelectedText());
        }

        document.addEventListener('mousedown', clickOutside);

        // clean up function before running new effect
        return () => {
            document.removeEventListener('mousedown', clickOutside);
        }
    }, [show])

    useEffect(() => {
        setCurDisplayValue(getSelectedText());
    }, [getSelectedText()])
    const showClass = `dropdown-list ${className || 'dropdown-menu dropdown-menu-right shadow animated--grow-in'} ${show && 'show'}`;
    
    const dblClickTimer = useRef<NodeJS.Timeout>(null);
    return <li className="nav-item dropdown no-arrow mx-1 navbar-nav" ref={topNode} onClick={e => {
        console.log(e.detail, 'detailssssss')
        e.preventDefault();
        clearTimeout(dblClickTimer.current);
        if (e.detail === 1) {
            dblClickTimer.current = setTimeout(() => {
                setShow(!show);        
             }, 200);
        }
        if (e.detail === 2) {
            //double click
            (e.target as any).select();
        }        
    }} >

        {
            //opts.getDropDownControl ? opts.getDropDownControl(show):
            <a className="" href="#"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <div className="input-group">
                        <input type="text" className="form-control bg-light border-0 small" placeholder={opts.placeHolder || '' }
                            aria-label="Search" aria-describedby="basic-addon2"
                            value={curDisplayValue}
                            onChange={e => {
                                setCurDisplayValue(e.target.value);
                            }}
                        />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button" onClick={e => {                            
                                //nav-link dropdown-toggle
                                e.stopPropagation();
                                e.preventDefault();
                            setShow(!show);     
                            setShowByButton(!show);
                                //setCurDisplayValue('');
                            }}>
                                <i className={show ?'far fa-arrow-alt-circle-down':"fas far fa-arrow-alt-circle-right"}></i>
                        </button>
                    </div>
                </div>
            </a>
        }
        <div className={showClass}>
            {
                (opts.mapItems ?? defaultItemsMapper)({
                    items,                    
                    opts,
                    curDisplayValue,
                    showByButton,
                    itemFormaterParam: {
                        onSelectionChanged: props.onSelectionChanged,
                        getDefaultSelectChangesFunc: data => {
                            return () => {
                                props.onSelectionChanged(data);
                                setCurDisplayValue(data.label);
                                setShow(false);
                            }
                        }
                    },                    
                })
            }
            {
                children
            }
        </div>
    </li>
}


interface IItemFormatterParams {
    onSelectionChanged: (any) => void;    
    getDefaultSelectChangesFunc: (data: IEditTextDropdownItem) => (() => void);    
}
interface IItemMapperParams {
    curDisplayValue: string;
    opts: IGenericDropdownPropsOptional;
    items: IEditTextDropdownItem[];    
    itemFormaterParam: IItemFormatterParams;
    showByButton: boolean;
}


export function defaultItemsMapper(prms: IItemMapperParams) {
    const { curDisplayValue, items:rawItems, opts, itemFormaterParam, showByButton } = prms;
    if (!rawItems) return null;    
    const filterItems = defaultFilterItems(curDisplayValue);    
    return (showByButton ? prms.items: prms.items.filter(filterItems)).map((data, keyInd) => {
        if (opts.dataFormatter) {
            return opts.dataFormatter(data, itemFormaterParam, keyInd);
        }        
        return <a className={"dropdown-item d-flex align-items-center"} href="" key={keyInd}
            onClick={itemFormaterParam.getDefaultSelectChangesFunc(data)}
        >            
            <div>
                {data.label || data.value}
            </div>
        </a>
    })
}

const defaultFilterItems = (curDisplayValue: string)=>((itm: IEditTextDropdownItem) => (itm.label || '').toLocaleLowerCase().includes((curDisplayValue || '').toLocaleLowerCase()))

export function fancyItemsMapper(prms: IItemMapperParams) {
    const { curDisplayValue, items, opts, itemFormaterParam } = prms;
    const filterItems = defaultFilterItems(curDisplayValue);
    return items && (items.length < 5 ? items : items.filter(filterItems)).map((dataStrict, keyInd) => {
        const data = dataStrict as any;
        if (opts.dataFormatter) {
            return opts.dataFormatter(data, itemFormaterParam, keyInd);
        }
        if (data.body) return data.body;
        if (data.header) {
            return <h6 className="dropdown-header">
                {data.header}
            </h6>
        }
        if (data.url) {
            return <a className="dropdown-item text-center small text-gray-500" href="#" key={keyInd}>{data.url}</a>
        }
        const clrClass = `icon-circle ${data.clsColor || 'bg-primary'}`;
        const iconClass = `fas text-white ${data.clsIcon || 'fa-file-alt'}`
        //dropdown-item d-flex align-items-center
        return <a className={data.className || "dropdown-item d-flex align-items-center"} href="" key={keyInd}
            onClick={itemFormaterParam.getDefaultSelectChangesFunc(data)}
        >
            {
                data.clsIcon && <div className="mr-3">
                    <div className={clrClass}>
                        <i className={iconClass}></i>
                    </div>
                </div>
            }
            <div>
                {data.subject && <div className="small text-gray-500">{data.subject}</div>}
                {data.label || data.value}
            </div>
        </a>
    })
}