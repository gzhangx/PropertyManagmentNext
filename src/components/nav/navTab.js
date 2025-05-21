export default function NavTab(props) {
    const {
        name,
        expanded,
        setExpanded,
        header,
        body,
    } = props;
    
    return <li className="nav-item">
        <div className={
            expanded ? "nav-link" : "nav-link collapsed"
        } href="#" 
            style={{
                cursor: "pointer",                
                userSelect:"none",
            }}
            data-toggle="collapse"
            onClick={e => {
                e.preventDefault();
                setExpanded(name, expanded);
            }}
        >
            {
                header
            }
        </div>
        <div className={expanded ? "collapse show" : "collapse"} >
            <div className="bg-white py-2 collapse-inner rounded">
                {
                    body
                }
            </div>
        </div>
    </li>
}