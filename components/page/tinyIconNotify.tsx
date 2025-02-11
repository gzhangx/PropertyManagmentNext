import { JSX, useState } from "react";

export type NotifyIconItem = {
    data?: any;
    header?: any;
    body?: any;
    url?: any;
    clsColor?: string;
    clsIcon?: string;
    subject?: string;
    text?: string | JSX.Element;
};
export default function TinyIconNotify(props: {
    icon?: string;
    count: number;
    children?: JSX.Element[];
    items?: NotifyIconItem[];
}) {
    const { icon, count, children, items } = props;
    const [show, setShow] = useState(false);
    const iconClass = `fas fa-fw ${icon || 'fa-bell'}`;
    const showClass = `dropdown-list dropdown-menu dropdown-menu-right shadow animated--grow-in ${show && 'show'}`;
    if (count === 0) return null;
    return <li className="nav-item dropdown no-arrow mx-1">
        <a className="nav-link dropdown-toggle" href="#" id="alertsDropdown" role="button"
            onClick={e => {
                e.preventDefault();
                setShow(!show);
            }}
            onBlur={() => {
                setShow(false);
            }}
            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i className={iconClass}></i>
            <span className="badge badge-danger badge-counter">{count}</span>
        </a>
        <div className={showClass}
            aria-labelledby="alertsDropdown">
            {
                items && items.map((data, keyInd) => {
                    if (data.body) return data.body;
                    if (data.header) {
                        return <h6 className="dropdown-header" key={keyInd}>
                            { data.header}
                        </h6>
                    }
                    if (data.url) {
                        return <a className="dropdown-item text-center small text-gray-500" href="#" key={keyInd}>{ data.url }</a>
                    }
                    const clrClass = `icon-circle ${data.clsColor || 'bg-primary'}`;
                    const iconClass = `fas text-white ${data.clsIcon || 'fa-file-alt'}`
                    return <a className="dropdown-item d-flex align-items-center" href="#" key={keyInd}>
                        <div className="mr-3">
                            <div className={clrClass}>
                                <i className={iconClass}></i>
                            </div>
                        </div>
                        <div>
                            <div className="small text-gray-500">{ data.subject }</div>
                            { data.text }
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