export default function NavTab(props) {
    const {
        name,
        expanded,
        setExpanded,
        header,
        body,
    } = props;
    
    return <li className="nav-item">
        <a className={
            expanded ? "nav-link" : "nav-link collapsed"
        } href="#" 
            data-toggle="collapse"
            onClick={e => {
                e.preventDefault();
                setExpanded(name, expanded);
            }}
        >
            {
                header
            }
        </a>
        <div className={expanded ? "collapse show" : "collapse"} >
            <div className="bg-white py-2 collapse-inner rounded">
                {
                    body
                }
            </div>
        </div>
    </li>
}