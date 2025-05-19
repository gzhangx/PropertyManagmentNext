
import { useEffect, useState } from 'react';
import { withRouter } from 'next/router'
import { useRootPageContext, getSideBarCurrentSelectedItemName } from "../components/states/RootState"
import {MainSideBar} from '../components/page/sidebar'
import { TopBar } from '../components/page/topbar'
import { Footer } from '../components/page/pageFooter'

import { sections, sideBarContentLookup, otherPages } from '../components/pageConfigs'
import { OriginalDashboard } from '../components/demo/origDashboard'
import { GenList } from '../components/uidatahelpers/GenList';
import { getGenListParms } from '../components/uidatahelpers/datahelpers';
import { usePageRelatedContext } from '../components/states/PageRelatedState';
import Login from './Login'
export default withRouter(function MainDashboard(props) {
  //const { state, setMainState } = props;  
  const rstate = useRootPageContext();
  const mainCtx = usePageRelatedContext();

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  if (!isClient) return <div>pre rendered</div>
  
  if (!rstate.isLoggedIn()) return <Login></Login>

  //const [pageState, setPageState] = pstate;
  const currentActivePage = getSideBarCurrentSelectedItemName(rstate);
  const sideBarItem = sideBarContentLookup.get(currentActivePage);
  //console.log('-----------> sidebar item ', sideBarItem.name, sideBarItem.table, currentActivePage)
  let page = sideBarItem?.page;
  if (sideBarItem?.table) {
    const prms = getGenListParms(mainCtx, sideBarItem?.table);
    page = <GenList {...prms}></GenList>
  }
  return (
    <div>
      <div id="wrapper" style={{position:'fixed', zIndex: 1,}}>
        <MainSideBar sections={sections} otherPages={otherPages}></MainSideBar>        
          <div id="content-wrapper" className="d-flex flex-column">
            <div id="content">
            {(rstate.sideBarStates['showNotSousedTopBar'] || mainCtx.topBarMessagesCfg.items.length > 0 || mainCtx.topBarErrorsCfg.items.length > 0) &&  <TopBar />}
              <div style={{margin:'30px'}}>
              {
              page || <OriginalDashboard />
              }
              </div>
            </div>
            <Footer />
          </div>        
      </div>                    
    </div>
  )
});

/*
<a className="scroll-to-top rounded" href="#page-top">
        <i className="fas fa-angle-up"></i>
      </a>

                
      <div className="modal fade" id="logoutModal" tabIndex={-1} role="dialog" aria-labelledby="exampleModalLabel"
        aria-hidden="true">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Ready to Leave?</h5>
              <button className="close" type="button" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body">Select "Logout" below if you are ready to end your current session.</div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" data-dismiss="modal">Cancel</button>
              <a className="btn btn-primary" href="login.html">Logout</a>
            </div>
          </div>
        </div>
      </div>
*/