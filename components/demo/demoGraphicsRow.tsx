import { EarningsGraph, RevenueSourceGraph } from './earningsGraph'
import DropdownTiny from './dropdownTiny'
import { useRootPageContext } from '../states/RootState';
import { usePageRelatedContext } from '../states/PageRelatedState';
import { getMonthAry, IPaymentWithDateMonthPaymentType, loadDataWithMonthRange, loadPayment } from '../utils/reportUtils';
import { useEffect, useState } from 'react';
export default function DemoGraphicsRow() {
    const rootCtx = useRootPageContext();
    const mainCtx = usePageRelatedContext();
    const [payments, setPayments] = useState<IPaymentWithDateMonthPaymentType[]>([]);
    async function load() {
        const selectedMonths = getMonthAry('Y2D');
        const paymentData: IPaymentWithDateMonthPaymentType[] = await loadDataWithMonthRange(rootCtx, mainCtx, loadPayment, selectedMonths, 'receivedDate', 'Rent Payment');
        if (rootCtx.checkLoginExpired(paymentData)) {
            console.log('Login expired, reload page');
            return;
        }
        setPayments(paymentData);
    }

    useEffect(() => {
        load()
    },['once']);
    return <div className="row">
        <div className="col-xl-8 col-lg-7">
            <div className="card shadow mb-4">
                <div
                    className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">Earnings Overview</h6>
                    <DropdownTiny>
                        <>
                            <div className="dropdown-header">Dropdown Header:</div>
                            <a className="dropdown-item" href="#">Load</a>
                            <div className="dropdown-divider"></div>
                            <a className="dropdown-item" href="#">Refresh</a>
                        </>
                    </DropdownTiny>
                </div>
                <div className="card-body">
                    <div className="chart-area">
                        <EarningsGraph payments={payments} />
                    </div>
                </div>
            </div>
        </div>

        <div className="col-xl-4 col-lg-5">
            <div className="card shadow mb-4">
                <div
                    className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                    <h6 className="m-0 font-weight-bold text-primary">Revenue Sources</h6>
                    <div className="dropdown no-arrow">
                        <a className="dropdown-toggle" href="#" role="button" id="dropdownMenuLink"
                            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <i className="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                        </a>
                        <div className="dropdown-menu dropdown-menu-right shadow animated--fade-in"
                            aria-labelledby="dropdownMenuLink">
                            <div className="dropdown-header">Dropdown Header:</div>
                            <a className="dropdown-item" href="#">Action</a>
                            <a className="dropdown-item" href="#">Another action</a>
                            <div className="dropdown-divider"></div>
                            <a className="dropdown-item" href="#">Something else here</a>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <div className="chart-pie pt-4 pb-2">
                        <RevenueSourceGraph payments={payments} />
                    </div>
                    <div className="mt-4 text-center small">
                        <span className="mr-2">
                            <i className="fas fa-circle text-primary"></i> Direct
                        </span>
                        <span className="mr-2">
                            <i className="fas fa-circle text-success"></i> Social
                        </span>
                        <span className="mr-2">
                            <i className="fas fa-circle text-info"></i> Referral
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
}