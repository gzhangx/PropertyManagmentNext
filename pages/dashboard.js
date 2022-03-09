
import { useEffect, useState } from 'react';
import { withRouter } from 'next/router'
import {MainSideBar} from '../components/page/sidebar.js'
import { TopBar } from '../components/page/topbar'
import { Footer } from '../components/page/pageFooter'
import BoardItemHalfSmall from '../components/page/boardItemHaflSmall'
import DemoRow from '../components/page/demorow.js'
import DemoGraphicsRow from '../components/page/demoGraphicsRow'

export default withRouter(function MainDashboard(props) {
  //const { state, setMainState } = props;  
  const pstate = useState({
    sideBarComponentExpanded: false,
    sideBarUtilitiesExpanded: false,
    userInfo: {},
    mainReports: [],
    currentSelectedGfReport: null,
  });
  const [state, setMainState] = pstate;
  //const [pageState, setPageState] = pstate;
  
  return (
    
    <div id="page-top">
      <div id="wrapper">
        <MainSideBar pstate={pstate}></MainSideBar>

        <div id="content-wrapper" className="d-flex flex-column">

          <div id="content">

            <TopBar pstate={pstate} state={state} />
            
            <div className="container-fluid">

              <div className="d-sm-flex align-items-center justify-content-between mb-4">
                <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
                <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i
                  className="fas fa-download fa-sm text-white-50"></i> Generate Report</a>
              </div>

              <div className="row">
                <BoardItemHalfSmall title="Earnings (Monthly)" value="$40,000" iconName="fa-calendar" />
                <BoardItemHalfSmall title="Earnings (Annual)" mainClsName='border-left-success'
                  textClsName='text-success'
                  value="$215,000" iconName="fa-dollar-sign" />

                <BoardItemHalfSmall title="Tasks" mainClsName='border-left-info'
                  textClsName='text-info'
                  value={
                    <>
                      <div className="row no-gutters align-items-center">
                        <div className="col-auto">
                          <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">50%</div>
                        </div>
                        <div className="col">
                          <div className="progress progress-sm mr-2">
                            <div className="progress-bar bg-info" role="progressbar"
                              style={{ width: '50%' }} aria-valuenow="50" aria-valuemin="0"
                              aria-valuemax="100"></div>
                          </div>
                        </div>
                      </div>
                    </>
                  } iconName="fa-clipboard-list" />

                <BoardItemHalfSmall title="Pending Requests" mainClsName='border-left-warning'
                  textClsName='text-warning'
                  value="18" iconName="fa-comments" />
              </div>

              <DemoGraphicsRow />

              <DemoRow mainState={state}></DemoRow>

            </div>

          </div>

          <Footer />

        </div>

      </div>
                
      <a className="scroll-to-top rounded" href="#page-top">
        <i className="fas fa-angle-up"></i>
      </a>

                
      <div className="modal fade" id="logoutModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel"
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
    </div>
  )
});
