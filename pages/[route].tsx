import Dashboard from './dashboard'
import { useRouter } from 'next/router'

import {
    useRootPageContext,
    activeSideBarItem, isSidebarItemActive,
} from "../components/states/RootState"

import { sideBarContentLookup} from '../components/rootContents'
import { useEffect } from 'react'
export default function () {
    const router = useRouter()
    const currentPath = router.query.route;
    const rs = useRootPageContext();
    
    useEffect(() => {
        if (currentPath && typeof currentPath === 'string') {
            if (sideBarContentLookup[currentPath]) {
                activeSideBarItem(rs, currentPath);
            }
        }
    }, [currentPath]);

    return <div>
        <Dashboard/>
    </div>
}