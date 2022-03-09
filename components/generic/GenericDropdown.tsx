import { useState , useEffect, useRef} from "react";

export interface IGenericDropdownProps {
    children?: any;
    items: any[];
    defaultShow?: boolean;
    className?: string;
    dataFormatter?: (any, keyInd: number) => (JSX.Element | string | null);
    dropDownControl?: (show: boolean) => JSX.Element;
}
export function GenericDropdown(props: IGenericDropdownProps) {
    const { children, items, defaultShow, className } = props;
    const [show, setShow] = useState(defaultShow || false);
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
    return <li className="nav-item dropdown no-arrow mx-1 navbar-nav" ref={topNode} onClick={e => {
        //nav-link dropdown-toggle
        e.preventDefault();
        console.log(`clicking set show to ${!show} from ${show}`)
        setShow(prev => {
            console.log(`in click set prev, prev=${prev}`);
            return !prev;
        });
    }} >

        {
            props.dropDownControl ? props.dropDownControl(show):
            <a className="" href="#"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <div className="input-group">
                    <input type="text" className="form-control bg-light border-0 small" placeholder="Search for..."
                        aria-label="Search" aria-describedby="basic-addon2" />
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
                items && items.map((data, keyInd) => {
                    if (props.dataFormatter) {
                        return props.dataFormatter(data, keyInd);
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
                    return <a className={data.className || "dropdown-item d-flex align-items-center"} href="" key={keyInd}>
                        {
                            data.clsIcon && <div className="mr-3">
                                <div className={clrClass}>
                                    <i className={iconClass}></i>
                                </div>
                            </div>
                        }
                        <div>
                            {data.subject && <div className="small text-gray-500">{data.subject}</div>}
                            {data.text}
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