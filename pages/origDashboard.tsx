import BoardItemHalfSmall from '../components/page/boardItemHaflSmall'
import DemoRow from '../components/page/demorow'
import DemoGraphicsRow from '../components/page/demoGraphicsRow'
export function OriginalDashboard() {
    return <div className="container-fluid">

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
                                        style={{ width: '50%' }} aria-valuenow={50} aria-valuemin={0}
                                        aria-valuemax={100}></div>
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

        <DemoRow></DemoRow>

    </div>
}