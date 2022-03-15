import { useRootPageContext, IRootPageState, getSideBarItemKey, getSideBarCurrentSelectedItemName } from "../components/states/RootState"

import {OriginalDashboard} from './origDashboard'
import { OwnerList } from '../components/page/reports/ownerList'
export function DashboardContent() {
    const rootState = useRootPageContext();

    const currentActivePage = getSideBarCurrentSelectedItemName(rootState);
    console.log(`debugremove currentact=${currentActivePage}`)
    switch(currentActivePage) {
        case 'Owner Info':            
            return <OwnerList/>
        case 'Dashboard':
        default:
            return <OriginalDashboard/>;            
    }
}