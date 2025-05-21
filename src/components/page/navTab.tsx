
import NavTab from "../nav/navTab";
import { useRootPageContext, IRootPageState, getSideBarKey } from "../states/RootState"


const toggleSideBar = (rstate: IRootPageState, name: string) => {    
    const key = getSideBarKey(name);
    const val = rstate.sideBarStates[key];
    rstate.setSideBarStates({
        ...rstate.sideBarStates,
        [key]: !val,
    })
};
const getSideBarState = (props: IRootPageState, name: string) => {
    const key = getSideBarKey(name);        
    return props.sideBarStates[key];
}

//
// all props must have const [pageState, setPageState] = props.pstate;
//
export function PageNavTab(props: any) {
    const { name, header, body } = props;
    const rs = useRootPageContext();
    const expanded = getSideBarState(rs, name);    
    return <NavTab name={name} expanded={expanded}
        header={header}
        body={body}    
        setExpanded={() => toggleSideBar(rs, name)}
    ></NavTab>
}