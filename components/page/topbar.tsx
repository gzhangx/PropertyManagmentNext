import TinyIconNotify from './tinyIconNotify'
import { useRootPageContext } from '../states/RootState'

import { CheckBoxMultiSelect } from '../uidatahelpers/CheckBoxMultiSelect'
import { useState } from 'react';
export function TopBar() {

    const rootContext = useRootPageContext();
                
    const [userProfileClicked, setUserProfileClicked] = useState(false);
    const ownerSels: {
        label: string;
        value: string;
    }[] = [];
    return <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow" suppressHydrationWarning >

        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
            <i className="fa fa-bars"></i>
        </button>

        <form
            className="d-none d-sm-inline-block form-inline mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
            <div className="input-group">
                <input type="text" className="form-control bg-light border-0 small" placeholder="Search for..."
                    aria-label="Search" aria-describedby="basic-addon2" />
                <div className="input-group-append">
                    <button className="btn btn-primary" type="button">
                        <i className="fas fa-search fa-sm"></i>
                    </button>
                </div>
            </div>
        </form>
        <div>
            <CheckBoxMultiSelect items={ownerSels} setSelected={sel => {
                const selMap = sel.reduce((acc, s) => {
                    acc[s.value] = true;
                    return acc;
                }, {                    
                } as { [key: number]: boolean; });
                //paymentCtx.setSelectedOwners(paymentCtx.allOwners.filter(o=>selMap[o.ownerID]))
            }}/>
        </div>

        <ul className="navbar-nav ml-auto">

            <li className="nav-item dropdown no-arrow d-sm-none">
                <a className="nav-link dropdown-toggle" href="#" id="searchDropdown" role="button"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i className="fas fa-search fa-fw"></i>
                </a>
                <div className="dropdown-menu dropdown-menu-right p-3 shadow animated--grow-in"
                    aria-labelledby="searchDropdown">
                    <form className="form-inline mr-auto w-100 navbar-search">
                        <div className="input-group">
                            <input type="text" className="form-control bg-light border-0 small"
                                placeholder="Search for..." aria-label="Search"
                                aria-describedby="basic-addon2" />
                            <div className="input-group-append">
                                <button className="btn btn-primary" type="button">
                                    <i className="fas fa-search fa-sm"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </li>

            <TinyIconNotify count="3"
                items={
                    [
                        { header: 'Alerts Center' },
                        {
                            clsColor: 'bg-primary',
                            clsIcon: 'fa-file-alt',
                            subject: 'December 12, 2019',
                            text: <span className="font-weight-bold">A new monthly report is ready to download!</span>
                        },
                        {
                            clsColor: 'bg-success',
                            clsIcon: 'fa-donate',
                            subject: 'December 7, 2021',
                            text: '$290.29 has been deposited into your account!'
                        },
                        {
                            clsColor: 'bg-warning',
                            clsIcon: 'fa-exclamation-triangle',
                            subject: 'December 12, 2021',
                            text: 'Tractor was not properly handled'
                        },
                        { url:'Show All Alerts'}
                    ]
                }
            >                                 
            </TinyIconNotify>

            <TinyIconNotify count="7">               
                    <h6 className="dropdown-header">
                        Message Center
                    </h6>
                    <a className="dropdown-item d-flex align-items-center" href="#">
                        <div className="dropdown-list-image mr-3">
                            <img className="rounded-circle" src="img/undraw_profile_1.svg"
                                alt="..." />
                            <div className="status-indicator bg-success"></div>
                        </div>
                        <div className="font-weight-bold">
                            <div className="text-truncate">Hi there! I am wondering if you can help me with a
                                problem I've been having.</div>
                            <div className="small text-gray-500">Emily Fowler · 58m</div>
                        </div>
                    </a>
                    <a className="dropdown-item d-flex align-items-center" href="#">
                        <div className="dropdown-list-image mr-3">
                            <img className="rounded-circle" src="img/undraw_profile_2.svg"
                                alt="..." />
                            <div className="status-indicator"></div>
                        </div>
                        <div>
                            <div className="text-truncate">I have the photos that you ordered last month, how
                                would you like them sent to you?</div>
                            <div className="small text-gray-500">Jae Chun · 1d</div>
                        </div>
                    </a>
                    <a className="dropdown-item d-flex align-items-center" href="#">
                        <div className="dropdown-list-image mr-3">
                            <img className="rounded-circle" src="img/undraw_profile_3.svg"
                                alt="..." />
                            <div className="status-indicator bg-warning"></div>
                        </div>
                        <div>
                            <div className="text-truncate">Last month's report looks great, I am very happy with
                                the progress so far, keep up the good work!</div>
                            <div className="small text-gray-500">Morgan Alvarez · 2d</div>
                        </div>
                    </a>
                    <a className="dropdown-item d-flex align-items-center" href="#">
                        <div className="dropdown-list-image mr-3">
                            <img className="rounded-circle" src="https://source.unsplash.com/Mv9hjnEUHR4/60x60"
                                alt="..." />
                            <div className="status-indicator bg-success"></div>
                        </div>
                        <div>
                            <div className="text-truncate">I want to rent a different tractor</div>
                            <div className="small text-gray-500">Chicken the Dog · 2w</div>
                        </div>
                    </a>
                    <a className="dropdown-item text-center small text-gray-500" href="#">Read More Messages</a>
            </TinyIconNotify>

            <div className="topbar-divider d-none d-sm-block"></div>

            <li className="nav-item dropdown no-arrow" >
                <a className="nav-link dropdown-toggle" href="#" id="userDropdown" role="button"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                    onClick={() => {
                        setUserProfileClicked(!userProfileClicked);
                    }}
                >
                    <span className="mr-2 d-none d-lg-inline text-gray-600 small" suppressHydrationWarning >{rootContext.userInfo.name}</span>
                    <img className="img-profile rounded-circle"
                        src="img/undraw_profile.svg" />
                </a>
                <div className={`dropdown-menu dropdown-menu-right shadow animated--grow-in ${userProfileClicked?'show':''}`}
                    aria-labelledby="userDropdown">
                    <a className="dropdown-item" href="#">
                        <i className="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i>
                        Profile
                    </a>
                    <a className="dropdown-item" href="#">
                        <i className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i>
                        Settings
                    </a>
                    <a className="dropdown-item" href="#">
                        <i className="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i>
                        Activity Log
                    </a>
                    <div className="dropdown-divider"></div>
                    <a className="dropdown-item" href="#" data-toggle="modal" data-target="#logoutModal"
                        onClick={() => {                            
                            rootContext.doLogout();
                    }}>
                        <i className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
                        Logout
                    </a>
                </div>
            </li>

        </ul>

    </nav>
}