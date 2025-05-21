import BoardItemHalfSmall from './boardItemHaflSmall'
import DemoRow from './demorow'
import DemoGraphicsRow from './demoGraphicsRow'
import { gatherLeaseInfomation, getAllMaintenanceForHouse, getAllPaymentForHouse, HouseWithLease, ILeaseInfoWithPmtInfo } from '../utils/leaseUtil';
import { IExpenseData, IHouseInfo, IPayment, ITenantInfo } from '../reportTypes';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { useEffect, useState } from 'react';
import { getLeases } from '../api';
import { orderBy, set } from 'lodash';
import { formatAccounting, standardFormatDate, removeZeroHourMinuteSeconds } from '../utils/reportUtils';
import { getTenantsForHouse } from '../utils/leaseEmailUtil';
import moment from 'moment';
import React from 'react';


interface HouseWithTenants extends HouseWithLease {
    payments?: IPayment[];
    expenses?: IExpenseData[];
    tenants: ITenantInfo[];
}

export function OriginalDashboard() {
    const mainCtx = usePageRelatedContext();
    const [allHouses, setAllHouses] = useState<HouseWithTenants[]>([]);
    const [curProgressText, setCurProgressText] = useState<string>('');
    const [selectedHouse, setSelectedHouse] = useState<HouseWithTenants | null>(null);
    useEffect(() => {
        //mainCtx.showLoadingDlg('Loading house info...');
        setCurProgressText('Loading house info...');
        mainCtx.loadForeignKeyLookup('houseInfo').then(async () => {
            //mainCtx.showLoadingDlg('Loading tenant info...');
            await mainCtx.loadForeignKeyLookup('tenantInfo');
    
            //mainCtx.showLoadingDlg('Loading leasse info...');
            const leases = await getLeases();
            //mainCtx.showLoadingDlg('');
    
            const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []).map(r=>r.data) as IHouseInfo[];
            const ownerDc = allHouses.reduce((acc, house) => {
                const ownerName = house.ownerName;
                if (!acc.dict[ownerName]) {
                    acc.owners.push(ownerName);
                    acc.dict[ownerName] = true;
                }
                return acc;
            }, {
                dict: {} as { [owner: string]: boolean; },
                owners: [] as string[],
            });
    
            const ht: HouseWithTenants[] = allHouses.map(h => ({ ...h, tenants: [] } as HouseWithTenants));;
            for (const h of ht) {
                setCurProgressText(`Loading ${h.address}`);
                const allLeases = orderBy(leases.filter(l => l.houseID === h.houseID), l => l.endDate, 'desc');
                const lastLease = allLeases[0];
                if (lastLease) {
                    h.lease = lastLease;
                }
            }
                    
            for (const h of ht) {
                console.log('gatherLeaseInfomation', h.address);
                const hlInfo = await gatherLeaseInfomation(h);
                const payments = await getAllPaymentForHouse(h.houseID);
                h.payments = payments;
                if (hlInfo !== 'Lease not found') {
                    console.log('gatherLeaseInfomation done', h.address);
                    h.leaseInfo = hlInfo.leaseBalance;
                }
    
                if (h.payments) {
                    h.payments = orderBy(h.payments, p => p.receivedDate, 'desc');
                }

                h.expenses = await getAllMaintenanceForHouse(h.houseID);
                if (h.expenses) {
                    h.expenses = orderBy(h.expenses, p => p.date, 'desc');
                }

                if (h.lease) {
                    h.tenants = await getTenantsForHouse(mainCtx, h);
                    if (h.leaseInfo || h.payments) {
                        const h = orderBy([...ht], h => h.leaseInfo?.totalBalance || 0, 'desc');
                        setAllHouses([...h]);
                    }
                } else {
                    h.tenants = [];
                }
                    
            }
            setCurProgressText('...');
        });    
    }, []);
    
    return <div className="container-fluid">

        <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Dashboard</h1>
            <a href="#" className="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i
                className="fas fa-download fa-sm text-white-50"></i> Generate Report {curProgressText}</a>
        </div>

        <div className="row">
            {
                allHouses.filter(h=>!h.disabled).map((h, key) => {
                    return <HouseWithRenterAndLeaseInfo key={key} house={h}                         
                        onClick={() => {
                            setSelectedHouse(h);                          
                        }}                        
                         />
                })
            }
            {false && <>
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
            </>
            }
        </div>

        {!selectedHouse && <DemoGraphicsRow />}

        {false && <DemoRow houses={allHouses}></DemoRow>} 

        {
            selectedHouse && <div className="row">
                {
                    <div className="col-12 mb-4">

                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Lease Info for {selectedHouse.address}
                                <div className="houseID"></div></h6>
                            </div>
                            <div className="card-body">
                                {
                                false &&<div className="text-center">
                                    <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{ width: '25rem' }}
                                        src="img/undraw_posting_photo.svg" alt="..." />
                                </div>
}
                                <p>
                                    Lease Starts <b>{standardFormatDate(selectedHouse.lease?.startDate)}  &nbsp; &nbsp;</b>
                                    Ends <b>{standardFormatDate(selectedHouse.lease?.endDate) ?? 'NA'} </b><br />
                                    Lease Amount <b>${formatAccounting(selectedHouse.lease?.monthlyRent)} </b>&nbsp; &nbsp;
                                    Deposit <b>${formatAccounting(selectedHouse.lease?.deposit)}</b> &nbsp; &nbsp;
                                    Pet Deposit <b>${formatAccounting(selectedHouse.lease?.petDeposit)}</b>
                                </p>
                                
                                <div className='flex'>                                    
                                    {
                                        selectedHouse.tenants.map((t, index) => {
                                            return <div className='tdNoBorder' key={index}>{t.fullName}<br></br> {t.email}<br></br> {t.phone}</div>
                                        })
                                    }
                                </div>
                                <div> &rarr;</div>
                            </div>
                        </div>

                    </div>
                }
                <div className="col-lg-6 mb-4">

                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">All payments { selectedHouse.address}</h6>
                        </div>
                        <div className="card-body">
                            {
                                selectedHouse.leaseInfo?.payments.reverse().map((p, index) => {
                                    return <React.Fragment key={index}><h4 className="small font-weight-bold">{removeZeroHourMinuteSeconds(mainCtx.utcDbTimeToZonedTime(p.receivedDate))} <span
                                        className="float-right">{formatAccounting(p.receivedAmount)}</span>
                                    </h4>
                                        <div className="progress mb-4">
                                            <div className="progress-bar bg-danger" style={{ width: selectedHouse.leaseInfo?.totalBalance ? '0%' : '100%' }}
                                                aria-valuenow={20} aria-valuemin={0} aria-valuemax={100}></div>
                                        </div>
                                    </React.Fragment>
                                })
                            }                           
                        </div>
                    </div>
                </div>
                <div className="col-lg-6 mb-4">

                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">All Expenses {selectedHouse.address}</h6>
                        </div>
                        <div className="card-body">
                            {
                                selectedHouse.expenses?.map((p, index) => {
                                    return <React.Fragment key={index}><h4 className="small font-weight-bold">{removeZeroHourMinuteSeconds(mainCtx.utcDbTimeToZonedTime(p.date))} <span
                                        className="float-right">{formatAccounting(p.amount)}</span>
                                    </h4>
                                        <div className="mb-4">
                                            <span>{p.category}</span>
                                        </div>
                                        <div className="mb-4">
                                            <span>{p.comment}</span>
                                        </div>
                                    </React.Fragment>
                                })
                            }
                        </div>
                    </div>
                </div>

                
            </div>
        }
    </div>
}



function HouseWithRenterAndLeaseInfo(props: {
    house: HouseWithTenants;
    key: number;
    onClick?: () => void;
}) {
    //title = { h.address }
    //value = { formatAccounting(h.leaseInfo?.totalBalance) ?? 'Loading'    
    const iconClassName = `fas fa-calendar fa-2x text-gray-300 fa - calendar`
    const mainClsName = `card shadow h-100 py-2 border-left-primary`;
    const textClsName = ` text-xs font-weight-bold text-uppercase mb-1 text-primary`;
    const h = props.house;

    const valueClsName = h.leaseInfo?.totalBalance as number > 0 ? 'text-danger' : '';

    function showLeaseDate(date: string | null | undefined, who: string) {
        if (!date) return `Unknown ${who}Date`;
        const str = moment(date).format('MM/DD/YYYY');
        if (who === 'Start') {
            return str;
        }
        if (moment().isAfter(moment(str).subtract(2, 'months'))) {
            return <span style={ {color:'red'}}>{str}</span>;
        }
        return str;
    }
    return <div key={h.houseID} className="col-xl-3 col-md-6 mb-4" onClick={() => {
        if (props.onClick) {
            props.onClick()
        }
    }}>
        <div className={mainClsName}>
            <div className="card-body">
                <div className="row no-gutters align-items-center">
                  
                    
                     <div className="col mr-2">
                         <div className={' font-weight-bold text-uppercase mb-1 text-primary fas fa-home'}>{h.address}</div> 
                        <div className={"h5 mb-0 font-weight-bold  " + (valueClsName || 'text-gray-800')}>{formatAccounting(h.leaseInfo?.totalBalance) ?? 'Loading'}</div>
                     
                     </div>
                    
                     

                </div>
                <div className="row no-gutters align-items-center">
                <div className=" col row-auto">
                      Lease Term: <i>{showLeaseDate(h.lease?.startDate, 'Start')}{ ' --  '}{showLeaseDate(h.lease?.endDate, 'End')}</i>
                     </div>

                </div>
                <div className="row no-gutters align-items-center">
                    <div className='col mr-2'>{ h.tenants? h.tenants.map(t=>(<>{t.email}  {t.phone}</>)).map(e=>(<>{e}<br></br></>)):''}</div>                    
                </div>              

            </div>
        </div>
    </div>
}