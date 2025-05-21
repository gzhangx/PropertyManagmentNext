'use client'
import * as React from 'react';
import {
  useRootPageContext,
  activeSideBarItem,
} from "./components/states/RootState"

import { sideBarContentLookup } from './components/pageConfigs'
import { useEffect } from 'react'
import { NAVPrefix } from './components/nav/consts'
import { usePageRelatedContext } from './components/states/PageRelatedState'
import { CloseableDialog } from './components/generic/basedialog'
import Dashboard from './pages/dashboard';


export default function DataGridDemo() {

  const rs = useRootPageContext();
  const mainCtx = usePageRelatedContext();  
  
  const asPath = window.location.hash;
  console.log('pathname in page', asPath, 'location.pathname', window.location.hash)
  const path = (new RegExp(`${NAVPrefix}\/(.*)$`).exec(asPath) || [])[1];
  const currentPath = path; // || router.query.route; 
  console.log('cur path', path, (new RegExp(`${NAVPrefix}\/(.*)$`).exec(asPath) || []))
  const onLoad = async () => {
    if (currentPath && typeof currentPath === 'string') {
      const curSel = sideBarContentLookup.get(currentPath);
      if (curSel) {
        if (curSel.table) {
          await mainCtx.modelsProp.getTableModel(curSel.table);
        }
      }
      activeSideBarItem(rs, currentPath);
    }
  };
  useEffect(() => {
    onLoad();
  }, [currentPath]);    
  
  return <div>
          <CloseableDialog show={!!mainCtx.loadingDlgContent} title={mainCtx.loadingDlgTitle}
              rootDialogStyle={{zIndex: 2000}}
              setShow={() => {
              mainCtx.showLoadingDlg(null);
          }}>
              {
                  typeof mainCtx.loadingDlgContent === 'string' ?
                  <div className="modal-body">
                      <div>
                          {mainCtx.loadingDlgContent}
                      </div>
                      </div>
                      :
                      mainCtx.loadingDlgContent
              }
                  </CloseableDialog>
          <Dashboard/>
      </div>
}
