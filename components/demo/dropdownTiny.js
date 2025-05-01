import { useState } from "react";
export default function DropdownTiny(props) {
    const [state, setState] = useState(false);
    const className = `dropdown-menu dropdown-menu-right shadow animated--fade-in ${state && 'show'}`;
    return <div className="dropdown no-arrow">
        <a className="dropdown-toggle" href="#" role="button"
            onBlur={
                ()=>setState(false)
            }
            onClick={e => {
                e.preventDefault();
                setState(!state);
            }}
            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
        </a>
        <div className={className}
            aria-labelledby="dropdownMenuLink">
            {
                props.children
            }
        </div>
    </div>
}