import { useState , useEffect, useRef, SetStateAction, Dispatch} from "react";


export interface IGenericDropdownProps {
    children?: any;
    items: any[];
    onSelectionChanged: (any) => void;
    opts?: IGenericDropdownPropsOptional;
}

export interface IGenericDropdownPropsOptional {    
    defaultShow?: boolean;
    className?: string;
    placeHolder?: string;
    selected?: any;
    setSelected?: Dispatch<SetStateAction<any>>;
    dataFormatter?: (any, keyInd: number) => (JSX.Element | string | null);
    getDropDownControl?: (show: boolean) => JSX.Element;
    filterItems?: (any) => boolean;
}

export function GenericDropdown(props: IGenericDropdownProps) {
    const { children, items, } = props;
    const opts = props.opts;
    const { defaultShow, className } = opts;
    const [show, setShow] = useState(defaultShow || false);
    const getSelectedText = () => (opts.selected ? opts.selected.label || opts.selected.value : '');
    const [curDisplayValue, setCurDisplayValue] = useState('');
    const topNode = useRef<HTMLLIElement>();
    useEffect(() => {
        const clickOutside = (e: MouseEvent) => {
            if (!topNode.current) return;
            if (topNode.current.contains(e.target as Node)) {
                return;
            }
            setShow(false)
        }

        document.addEventListener('mousedown', clickOutside);

        // clean up function before running new effect
        return () => {
            document.removeEventListener('mousedown', clickOutside);
        }
    }, [show])
    const showClass = `dropdown-list ${className || 'dropdown-menu dropdown-menu-right shadow animated--grow-in'} ${show && 'show'}`;

    const filterItems = opts.filterItems || (itm=>(itm.label || '').toLocaleLowerCase().includes(curDisplayValue.toLocaleLowerCase()))
    return <li className="nav-item dropdown no-arrow mx-1 navbar-nav" ref={topNode} onClick={e => {
        //nav-link dropdown-toggle
        e.preventDefault();
        setShow(!show);
    }} >

        {
            opts.getDropDownControl ? opts.getDropDownControl(show):
            <a className="" href="#"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <div className="input-group">
                        <input type="text" className="form-control bg-light border-0 small" placeholder={opts.placeHolder || '' }
                            aria-label="Search" aria-describedby="basic-addon2"
                            value={curDisplayValue || getSelectedText()}
                            onChange={e => {
                                setCurDisplayValue(e.target.value);
                            }}
                        />
                    <div className="input-group-append">
                        <button className="btn btn-primary" type="button">
                                <i className={show ?'far fa-arrow-alt-circle-down':"fas far fa-arrow-alt-circle-right"}></i>
                        </button>
                    </div>
                </div>
            </a>
        }
        <div className={showClass}>
            {
                items && items.filter(filterItems).map((data, keyInd) => {
                    if (opts.dataFormatter) {
                        return opts.dataFormatter(data, keyInd);
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
                        onClick={() => {   
                            props.onSelectionChanged(data);
                            opts.setSelected(data);
                            setCurDisplayValue('');
                            setShow(false);
                        }}
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
            {
                children
            }
        </div>
    </li>
}