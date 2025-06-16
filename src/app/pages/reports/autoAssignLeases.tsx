import * as api from '../../../components/api'
import { gatherLeaseInfomation, getLeaseUtilForHouse, HouseWithLease, ILeaseInfoWithPmtInfo } from '../../../components/utils/leaseUtil';
import { IHouseInfo, ILeaseInfo, IPayment } from '../../../components/reportTypes';
import { Fragment, useEffect, useState } from 'react';
import { usePageRelatedContext } from '../../../components/states/PageRelatedState';
import Link from 'next/link';
import { formateEmail } from '../../../components/utils/leaseEmailUtil';
import { CloseableDialog } from '../../../components/generic/basedialog';
import { formatAccounting } from '../../../components/utils/reportUtils';
import { Checkbox, FormControlLabel } from '@mui/material';


export function getLeasePage() {
    return <AutoAssignLeases></AutoAssignLeases>
}

type HouseWithLeaseAndConfig = {
    addPreviousLeaseBalance: boolean;
} & HouseWithLease;
export default function AutoAssignLeases() {
        

    const mainCtx = usePageRelatedContext();
    const setTopBarMessages = mainCtx.topBarMessagesCfg.setTopBarItems;
    const setTopBarErrors = mainCtx.topBarErrorsCfg.setTopBarItems;
    const [houses, setHouses] = useState<HouseWithLeaseAndConfig[]>([]);
    const [processingHouseId, setProcessingHouseId] = useState('');
    const [disableProcessing, setDisableProcessing] = useState(false);

    let fixingAllHouses = false;
    const [leaseExpanded, setLeaseExpanded] = useState<{ [key: string]: boolean }>({});

    const [emailPreview, setEmailPreview] = useState({
        subject: '',
        to: '',
        html: '',
        edit: false,
    })
    async function fixHouses(house: HouseWithLease) {
        const houseID = house.houseID;
        setProcessingHouseId(houseID);
        mainCtx.showLoadingDlg('Fixing ' + house.address);
        const finder = await getLeaseUtilForHouse(houseID);
        const all = (await finder.matchAndAddLeaseToTransactions((pos, pmt) => {
            if (!pmt) {
                setTopBarMessages(state => {
                    return [...state, {
                        clsColor: 'bg-success',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Found ${pos} payments for house`
                    }]
                });
            } else {
                const lease = finder.allLeases.find(l => l.leaseID === pmt.leaseID);
                if (!lease) return;
                setTopBarMessages(state => {
                    return [...state, {
                        clsColor: 'bg-success',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Set lease ${pmt.leaseID} ${lease.startDate} ${lease.endDate} to ${pmt.houseID} ${pmt.receivedAmount}`,
                    }]
                });
            }
        })) as IPayment[];

        const noLeases = all.filter(t => !t.leaseID);
        if (noLeases.length) {
            setTopBarErrors(noLeases.map(t => {
                return {
                    clsColor: 'bg-warn',
                    clsIcon: 'fa-donate',
                    //subject: 'December 7, 2021',
                    text: `Unable to find lease for payment ${t.receivedAmount} ${t.receivedDate} addr=${t.address} house=${t.houseID}`
                }
            }));    
        }
        
        const lease = await finder.findLeaseForDate(new Date());
        house.lease = lease as ILeaseInfo;
        return lease;
    }

    async function processAllHouses() {
        fixingAllHouses = true;
        mainCtx.showLoadingDlg('Fixing houses');
        setTopBarMessages([
            { header: 'Process all' }
        ]);
        setTopBarErrors([]);
        setDisableProcessing(true);
        for (const house of houses) {
            await fixHouses(house);
            await processOneHouse(house);
        }
        setHouses(houses);
        setDisableProcessing(false);
        mainCtx.showLoadingDlg(null);
        fixingAllHouses = false;
    }
    useEffect(() => {
        setTopBarMessages([
            { header: 'Houses Loaded' }
        ]);
        setTopBarErrors([]);
        api.getHouseInfo().then(houses => {
            setHouses(houses.map(h => ({
                ...h,
                addPreviousLeaseBalance: true,
            })));
            setTopBarMessages(state => {
                return [...state, {
                    clsColor: 'bg-success',
                    clsIcon: 'fa-donate',
                    //subject: 'December 7, 2021',
                    text: 'Loaded ' + houses.length
                }]
            });
        })
    }, []);



    const processOneHouse = async (house: HouseWithLeaseAndConfig, expand = false) => {
        if (house.leaseInfo && house.lease) {
            const leaseID = house.lease.leaseID;
            if (expand) {
                setLeaseExpanded({
                    ...leaseExpanded,
                    [leaseID]: !leaseExpanded[leaseID],
                })
                //return;
            }            
        }
        if (expand) {
            setTopBarMessages([
                { header: `House ${house.address}` }
            ]);
        }
        setProcessingHouseId(house.houseID);
        const lease = await gatherLeaseInfomation(house, house.addPreviousLeaseBalance);

        if (lease === 'Lease not found') {
            setTopBarErrors(state => {
                return [
                    ...state,
                    {
                        clsColor: 'bg-warning',
                        clsIcon: 'fa-donate',
                        //subject: 'December 7, 2021',
                        text: `Cant find leases ${house.address}`
                    }
                ];
            })
            return;
        }
        const leaseID = lease.lease.leaseID;
        //if (leaseExpanded[leaseID]) {
        //    setLeaseExpanded({
        //        ...leaseExpanded,
        //        [leaseID]: false,
        //    });
        //    return;
        //}

        const leaseBalanceDueInfo = lease.leaseBalanceDueInfo;
        if (leaseBalanceDueInfo) {
            setTopBarMessages(state => {
                return [...state, {
                    clsColor: 'bg-success',
                    clsIcon: 'fa-donate',
                    //subject: 'December 7, 2021',
                    text: `${leaseBalanceDueInfo.lastPaymentDate} balance=${leaseBalanceDueInfo.totalBalance}`
                }]
            });
        }

        setHouses(houses);

        if (expand) {
            setLeaseExpanded({
                ...leaseExpanded,
                [leaseID]: !leaseExpanded[leaseID],
            });
        }
    }
    

    const closePreview = () => {
        setEmailPreview({
            to: '',
            html: '',
            subject: '',
            edit: false,
        });
    };

    return <div>
            <CloseableDialog show={!!emailPreview.html}
            rootDialogStyle={{
                maxWidth: '1000px'
            }}
            setShow={closePreview}
            footer={<div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                    await api.sendEmail(emailPreview.to.split(','), emailPreview.subject, emailPreview.html);
                }}>Send</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                    setEmailPreview(state => {
                        return {
                            ...state,
                            edit: !emailPreview.edit,
                        }
                    })
                }}>{ emailPreview.edit? 'Stop Edit': 'Edit'}</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={closePreview}>Close</button>
            </div>}
        >
            <div style={{overflow:'scroll'}}>
                <div className="container-fluid">
                        <div className="row">
                            <div className="card bg-primary text-white shadow">
                            <div className="card-body">
                                <input type='text'
                                    className="form-control "
                                    placeholder='Email To'
                                    size={emailPreview.to.length}
                                    value={emailPreview.to} onChange={e => {
                                    setEmailPreview(state => {
                                        return {
                                            ...state,
                                            to: e.target.value,
                                        }
                                    })
                                }}></input>
                                    <div className="text-white-50 small">to</div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="card bg-success text-white shadow">
                                <div className="card-body">
                                {emailPreview.edit ? <input type='text'
                                    className="form-control "
                                    placeholder='Subject'
                                    size={emailPreview.subject.length}
                                    value={emailPreview.subject} onChange={e => {
                                        setEmailPreview(state => {
                                            return {
                                                ...state,
                                                subject: e.target.value,
                                            }
                                        })
                                    }}></input> : emailPreview.subject}
                                    <div className="text-white-50 small">subject</div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                        <div className="card bg-info text-white shadow">
                            {emailPreview.edit ? <textarea rows={10} cols={100}
                                value={emailPreview.html}
                                onChange={e => {                                    
                                    setEmailPreview(state => {
                                        return {
                                            ...state,
                                            html: e.target.value,
                                        }
                                    })
                                }}
                            />
                                : <div dangerouslySetInnerHTML={{ __html: emailPreview.html }}></div>}
                                
                            </div>
                        </div>                        
                </div>
            </div>
        </CloseableDialog>
        <table className="table">
            <thead>
                <tr>
                    <th scope="col"><button className='btn btn-primary' disabled={disableProcessing} onClick={processAllHouses}>House Process All</button></th>
                    <th></th>
                    <th>Balance</th>
                    <th>Owner</th>
                    <th>Id</th>
                </tr>
            </thead>
            <tbody>
                {
                    houses.map((house, key) => {
                        return <Fragment key={key}><tr>
                            <td>{house.address} </td><td>
                                <button className='btn btn-primary' onClick={() => {
                                    if (!house.leaseInfo) {
                                        mainCtx.showLoadingDlg('Fixing');
                                    }
                                    processOneHouse(house, true).then(() => {
                                        mainCtx.showLoadingDlg(null);
                                    })                                   
                                 }}>E</button>
                            </td>
                            <td>{house.leaseBalanceDueInfo ? house.leaseBalanceDueInfo.totalBalance : 'NA'}</td><td>{house.ownerName}</td><td className={processingHouseId === house.houseID ? 'bg-warning' : ''}>{house.houseID}</td>
                            <td><button disabled={disableProcessing} className='btn btn-primary'
                            onClick={() => {
                                setDisableProcessing(true);
                                fixHouses(house).then(() => {                                    
                                    setHouses(houses);
                                    setDisableProcessing(false);
                                    mainCtx.showLoadingDlg(null);
                                })
                            }}
                            >Fix</button></td>                            
                        </tr>
                        {
                            house.lease && leaseExpanded[house.lease.leaseID] && house.leaseBalanceDueInfo && <tr>
                                <td colSpan={4}>
                                    <div className="card shadow mb-4">
                                            <div className="card-header py-3">
                                                <div style={{display:'flex'}}>
                                                <h6 className="m-0 font-weight-bold text-primary">Details</h6>
                                                <Link style={{marginLeft: '5px', marginTop: '0px'}} href='#' onClick={async e => {

                                                    const formatedData = await formateEmail(mainCtx, house, err => {
                                                        mainCtx.topBarErrorsCfg.setTopBarItems(itm => {
                                                            return [...itm, {
                                                                text: err,
                                                            }]
                                                        })
                                                    });
//                                                     await mainCtx.loadForeignKeyLookup('tenantInfo');

//                                                     let last2 = '';
//                                                     for (let i = 0; i < 2; i++) {
//                                                         const inf = house.leaseInfo.monthlyInfo[i];
//                                                         if (!inf) break;
//                                                         last2 += `${inf.month}  Balance ${inf.balance}  Paid: ${inf.paid}\n`
//                                                     }
//                                                     const mailToIds = [];
//                                                     for (let i = 1; i <= 5; i++) {
//                                                         const id = house.lease['tenant' + i];
//                                                         if (id) mailToIds.push(id);
//                                                     }
//                                                     const tenantMaps = mainCtx.foreignKeyLoopkup.get('tenantInfo');
//                                                     const mailtos = mailToIds.map(id => (tenantMaps.idDesc.get(id) as any)?.email || `UnableToGetName${id}`).join(';');

//                                                     const subject = encodeURIComponent(`Payment received for ${house.address}`);
//                                                     const body = encodeURIComponent(`
// Dear tenant,
// Thank you for your payment, Below is your summary
// ${last2}`);
                                                    //                                                     const mailto = `mailto:${mailtos}?subject=${subject}&body=${body}`;
                                                    //const mailto = `mailto:${formatedData.mailtos}?subject=${formatedData.subject}&body=${formatedData.body}`;
                                                    //window.location.href = mailto;

                                                    setEmailPreview({
                                                        to: formatedData.mailtos.join(','),
                                                        subject: formatedData.subject,
                                                        html: formatedData.body,
                                                        edit: false,
                                                    })
                                                    //await api.sendEmail(formatedData.mailtos, formatedData.subject, formatedData.body);
                                                    e.preventDefault();
                                                    }}>Email</Link>
                                                    <FormControlLabel control={<Checkbox checked={house.addPreviousLeaseBalance || false} onChange={e => {
                                                        house.addPreviousLeaseBalance = e.target.checked;
                                                        setHouses([ ...houses, ])
                                                        mainCtx.showLoadingDlg('fixing');
                                                        processOneHouse(house).then(() => {
                                                            mainCtx.showLoadingDlg(null);
                                                        })
                                                    }} />} label="Add Previous lease balance" />
                                                </div>                                                
                                        </div>
                                        <div className="card-body">
                                            <table className='table'>
                                                <tbody>
                                                    <tr><td colSpan={2}> lease.totalPayments</td><td colSpan={2}> lease.totalMissing</td></tr>
                                                        <tr><td colSpan={2}>{house.leaseBalanceDueInfo.totalPaid}</td><td colSpan={2}>{house.leaseBalanceDueInfo.totalBalance}</td></tr>
                                                        <tr><td>date</td><td>type</td><td>Amount</td><td>Balance</td></tr>
                                                    {
                                                            house.leaseBalanceDueInfo.paymnetDuesInfo.map(info => {
                                                                return <tr><td>{info.date}</td><td>{(info.paymentOrDueTransactionType)}</td><td>{formatAccounting(info.paymentOrDueAmount)}</td><td>{ formatAccounting(info.newBalance)}</td></tr>
                                                        })
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            }
                        </Fragment>
                    })               
                }
            </tbody>
        </table>
    </div>

}



