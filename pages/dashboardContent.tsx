import { useRootPageContext, IRootPageState, getSideBarItemKey, getSideBarCurrentSelectedItemName } from "../components/states/RootState"

import {OriginalDashboard} from './origDashboard'
import { contents } from './rootContents'
export function DashboardContent() {
    const rootState = useRootPageContext();

    const currentActivePage = getSideBarCurrentSelectedItemName(rootState);
    console.log(`debugremove currentact=${currentActivePage}`)
    return contents[currentActivePage] || <OriginalDashboard/>    
}