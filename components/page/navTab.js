
import NavTab from "../nav/navTab";


const getSideBarKey = name => `sideBar${name}Expanded`;
const toggleSideBar = (props, name) => {
    const [pageState, setPageState] = props.pstate;
    const key = getSideBarKey(name);
    const val = pageState[key];
    setPageState({
        ...pageState,
        [key]: !val,
    })
};
const getSideBarState = (props,name) => {
    const key = getSideBarKey(name);
    const [pageState, setPageState] = props.pstate;
    return pageState[key];
}

//
// all props must have const [pageState, setPageState] = props.pstate;
//
export function PageNavTab(props) {
    const { name, header, body } = props;
    const expanded = getSideBarState(props, name);    
    return <NavTab name={name} expanded={expanded}
        header={header}
        body={body}    
        setExpanded={exp => toggleSideBar(props, name)}
    ></NavTab>
}