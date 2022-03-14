import Link from 'next/link'
import { PageNavTab } from './navTab';
import { useRootPageContext, IRootPageState, getSideBarItemKey, getSideBarCurrentActiveItemKey } from "../states/RootState"

export function MainSideBar() {    
    const rs = useRootPageContext();
    const getItemLink = (name: string) => {
        const itemName = getSideBarItemKey(name);
        const active = rs.pageStates[getSideBarCurrentActiveItemKey()] === itemName;
        return <a className="collapse-item" href="#" onClick={() => {
            const curActiveName = rs.pageStates[getSideBarCurrentActiveItemKey()] as string;
            if (curActiveName) {
                rs.pageStates[rs.pageStates[getSideBarCurrentActiveItemKey()] as string] = false;
            }
            
            rs.pageStates[getSideBarCurrentActiveItemKey()] = itemName;
            rs.pageStates[itemName] = true;
            rs.setPageStates({ ...rs.pageStates });
        }}>{name} {active ?'_A':''}</a>;
    }
    return <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

        <a className="sidebar-brand d-flex align-items-center justify-content-center" href="index.html">
            <div className="sidebar-brand-icon rotate-n-0">
                <i className="fas fa-home"></i>
            </div>
            <div className="sidebar-brand-text mx-3">PropMgt<sup>tm</sup></div>
        </a>

        <hr className="sidebar-divider my-0" />

        <li className="nav-item active">
            <a className="nav-link" href="#" onClick={e => e.preventDefault()}>
                <i className="fas fa-fw fa-tachometer-alt"></i>
                <span>Dashboard</span></a>
        </li>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">
            Interface
        </div>

        <PageNavTab name="Components"
            header={
                <>
                    <i className="fas fa-fw fa-cog"></i>
                    <span>Components</span>
                </>
            }
            body={
                <>
                    <h6 className="collapse-header">Custom Components:</h6>
                    <a className="collapse-item" href="#">Developers</a>
                    <a className="collapse-item" href="#">Admins</a>
                    {
                        ['Developers', 'Admins'].map(getItemLink)
                    }
                </>
            }
        ></PageNavTab>

        <PageNavTab name="PM Reports"
            header={
                <>
                    <a>
                        <i className="fas fa-fw fa-wrench"></i>
                        <span>PM Reports</span>
                    </a>
                </>
            }
            body={
                <>
                    <h6 className="collapse-header">Demo Reports:</h6>
                    {/*
                        (state.mainReports || []).map(r => {
                            return <a className="collapse-item" href="#"
                                onClick={e => {
                                    e.preventDefault();
                                    setState(prev => ({
                                        ...prev,
                                        currentSelectedGfReport: r,
                                    }));
                                }}
                            >{r.title.length > 24 ? r.title.substr(0, 19) + '...' : r.title} ({ r.entries})</a>
                        })
                    */
                    }                    
                </>
            }
        ></PageNavTab>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">
            Addons
        </div>

        <PageNavTab name="Pages"
            header={
                <>
                    <i className="fas fa-fw fa-folder"></i>
                    <span>Pages</span>
                </>
            }
            body={
                <>
                    <h6 className="collapse-header">Login Screens:</h6>
                    <Link href="Login">
                    <a className="collapse-item" href="#">Login</a>
                    </Link>
                    <Link href="register">
                    <a className="collapse-item" href="register.html">Register</a>
                    </Link>
                    <Link href="forget">
                    <a className="collapse-item" href="forgot-password.html">Forgot Password</a>
                    </Link>
                    <div className="collapse-divider"></div>
                    <h6 className="collapse-header">Other Pages:</h6>
                    <a className="collapse-item" href="#">Demo</a>
                </>
            }
        ></PageNavTab>
        
        <li className="nav-item">
            <a className="nav-link" href="#">
                <i className="fas fa-fw fa-chart-area"></i>
                <span>Charts</span></a>
        </li>

        <li className="nav-item">
            <a className="nav-link" href="#">
                <i className="fas fa-fw fa-table"></i>
                <span>Tables</span></a>
        </li>

        <hr className="sidebar-divider d-none d-md-block" />

        <div className="text-center d-none d-md-inline">
            <button className="rounded-circle border-0" id="sidebarToggle"></button>
        </div>

        <div className="sidebar-card d-none d-lg-flex">
            <img className="sidebar-card-illustration mb-2" src="/img/undraw_rocket.svg" alt="..."   width={100} height={100} />
            <p className="text-center mb-2"><strong>SB Admin Pro</strong> is packed with premium features, components, and more!</p>
            <a className="btn btn-success btn-sm" href="#">Upgrade to Pro!</a>
        </div>

    </ul>
}