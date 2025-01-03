import Dashboard from './dashboard'
import { useRouter } from 'next/router'

import {
    useRootPageContext,
    activeSideBarItem,
} from "../components/states/RootState"

import { useIncomeExpensesContext } from '../components/states/PaymentExpenseState'

import { sideBarContentLookup} from '../components/rootContents'
import { useEffect } from 'react'
import { NAVPrefix } from '../components/nav/consts'
import { getTableModel } from '../components/uidatahelpers/datahelpers'
export default function () {
    const router = useRouter()    
    const rs = useRootPageContext();
    const mainCtx = useIncomeExpensesContext();
    const path = (new RegExp(`${NAVPrefix}\/(.*)$`).exec(router.asPath) || [])[1];
    const currentPath = path || router.query.route;
    const onLoad = async () => {
        if (currentPath && typeof currentPath === 'string') {
            const curSel = sideBarContentLookup.get(currentPath);
            if (curSel) {
                if (curSel.table) {
                    await getTableModel(mainCtx, curSel.table);
                }
                activeSideBarItem(rs, currentPath);
            }
        }
    };
    useEffect(() => {
        onLoad();
    }, [currentPath]);

    return <div>
        <Dashboard/>
    </div>
}