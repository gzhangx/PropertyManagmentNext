import { useState , useEffect, useRef, Dispatch, SetStateAction} from "react";


export interface IGenericMultiSelectDropdownProps {    
    items: any[];
    selected: any[];
    setSelected: (sel: any[]) => void;
    defaultShow?: boolean;
    renderSelected: (sel: any[], show: boolean, setShow: Dispatch<SetStateAction<boolean>>) => JSX.Element;
    renderItem: (item: any, prop: IGenericMultiSelectDropdownProps, key:number) => JSX.Element;
}

export function GenericMultiSelectDropdown(props: IGenericMultiSelectDropdownProps) {
    const { items, defaultShow} = props;
    
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
    const showClass = `dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in ${show && 'show'}`;

    return <li className="nav-item dropdown no-arrow mx-1 navbar-nav" ref={topNode} onClick={e => {
        //nav-link dropdown-toggle
        e.preventDefault();
        setShow(!show);
    }} >

        {
            props.renderSelected(props.selected, show, setShow)
        }
        <div className={showClass}>
            {
                items && items.map((data, keyInd) => props.renderItem(data, props, keyInd))
            }            
        </div>
    </li>
}