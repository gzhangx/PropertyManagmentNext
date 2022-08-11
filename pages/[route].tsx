import Dashboard from './dashboard'
import { useRouter } from 'next/router'

import {
    useRootPageContext,
    activeSideBarItem, isSidebarItemActive,
} from "../components/states/RootState"

import { sideBarContentLookup} from '../components/rootContents'
import { useEffect } from 'react'
import { NAVPrefix } from '../components/nav/consts'
export default function () {
    const router = useRouter()    
    const rs = useRootPageContext();
    const path = (new RegExp(`${NAVPrefix}\/(.*)$`).exec(router.asPath) || [])[1];
    const currentPath = path || router.query.route;
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