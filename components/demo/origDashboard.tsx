import BoardItemHalfSmall from './boardItemHaflSmall'
import DemoRow from './demorow'
import DemoGraphicsRow from './demoGraphicsRow'
import { gatherLeaseInfomation, getAllPaymentForHouse, HouseWithLease, ILeaseInfoWithPmtInfo } from '../utils/leaseUtil';
import { IHouseInfo, IPayment, ITenantInfo } from '../reportTypes';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { useEffect, useState } from 'react';
import { getLeases } from '../api';
import { orderBy, set } from 'lodash';
import { removeZeroHourMinuteSeconds } from '../utils/reportUtils';
import { getTenantsForHouse } from '../utils/leaseEmailUtil';


interface HouseWithTenants extends HouseWithLease {
    payments?: IPayment[];
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
    
            const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
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
                allHouses.filter(h=>!h.disabled).map((h, index) => {
                    return <BoardItemHalfSmall key={index} title={h.address} value={h.leaseInfo?.totalBalance ?? 'Loading'}
                        onClick={() => {
                            setSelectedHouse(h);                          
                        }}
                        iconName="fa-home" mainClsName='border-left-primary'
                        textClsName='text-primary' />
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

        <DemoGraphicsRow />

        {false && <DemoRow houses={allHouses}></DemoRow>} 

        {
            selectedHouse && <div className="row">
                <div className="col-lg-6 mb-4">

                    <div className="card shadow mb-4">
                        <div className="card-header py-3">
                            <h6 className="m-0 font-weight-bold text-primary">All payments { selectedHouse.address}</h6>
                        </div>
                        <div className="card-body">
                            {
                                selectedHouse.leaseInfo?.payments.map((p, index) => {
                                    return <><h4 className="small font-weight-bold" key={index}>{removeZeroHourMinuteSeconds(mainCtx.utcDbTimeToZonedTime(p.receivedDate))} <span
                                        className="float-right">{p.receivedAmount}</span>
                                    </h4>
                                        <div className="progress mb-4">
                                            <div className="progress-bar bg-danger" style={{ width: selectedHouse.leaseInfo?.totalBalance ? '0%' : '100%' }}
                                                aria-valuenow={20} aria-valuemin={0} aria-valuemax={100}></div>
                                        </div>
                                    </>
                                })
                            }                           
                        </div>
                    </div>
                </div>

                {
                    <div className="col-lg-6 mb-4">

                        <div className="card shadow mb-4">
                            <div className="card-header py-3">
                                <h6 className="m-0 font-weight-bold text-primary">Lease Info</h6>
                            </div>
                            <div className="card-body">
                                <div className="text-center">
                                    <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{ width: '25rem' }}
                                        src="img/undraw_posting_photo.svg" alt="..." />
                                </div>
                                <p>
                                    Lease Started {selectedHouse.lease?.startDate} <br />
                                    Lease Ends {selectedHouse.lease?.endDate ?? 'NA'} <br />
                                    Lease Amount {selectedHouse.lease?.monthlyRent} <br />
                                </p>
                                <p>                                    
                                    {
                                        selectedHouse.tenants.map((t, index) => {
                                            return <div key={index}>{t.fullName}<br></br> {t.email}<br></br> {t.phone}</div>
                                        })
                                    }
                                </p>
                                <div> &rarr;</div>
                            </div>
                        </div>

                    </div>
                }
            </div>
        }
    </div>
}