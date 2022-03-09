
import NavTab from "../nav/navTab";
import { useRootPageContext, IRootPageState } from "../states/RootState"

const getSideBarKey = name => `sideBar${name}Expanded`;
const toggleSideBar = (rstate: IRootPageState, name) => {    
    const key = getSideBarKey(name);
    const val = rstate.pageStates[key];
    rstate.setPageStates({
        ...rstate.pageStates,
        [key]: !val,
    })
};
const getSideBarState = (props: IRootPageState, name) => {
    const key = getSideBarKey(name);        
    return props.pageStates[key];
}

//
// all props must have const [pageState, setPageState] = props.pstate;
//
export function PageNavTab(props) {
    const { name, header, body } = props;
    const rs = useRootPageContext();
    const expanded = getSideBarState(rs, name);    
    return <NavTab name={name} expanded={expanded}
        header={header}
        body={body}    
        setExpanded={exp => toggleSideBar(rs, name)}
    ></NavTab>
}