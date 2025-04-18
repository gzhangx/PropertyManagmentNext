import React, { useState, useEffect } from "react";

import { EditTextDropdown  } from '../../components/generic/EditTextDropdown';
import {    
    IHouseInfo,
} from '../../components/reportTypes';

import { usePageRelatedContext } from "../../components/states/PageRelatedState";
import { useRootPageContext } from "../../components/states/RootState";
import { IEditTextDropdownItem } from "../../components/generic/GenericDropdown";
import { CloseableDialog } from "../../components/generic/basedialog";
import { orderBy } from "lodash";
import { formatAccounting, getMonthAry, IPaymentWithDateMonthPaymentType, loadDataWithMonthRange, loadPayment, MonthSelections } from "../../components/utils/reportUtils";


const amtDsp = (amt: number) => {
    if (!amt) return 0;
    return formatAccounting(amt);
}





type RentReportCellData = {
    amount: number;
    payments: IPaymentWithDateMonthPaymentType[];
}

type RentReportMonthRowData = {
    [month: string]: RentReportCellData;
}

type AllRentReportData = {
    [houseID: string]: RentReportMonthRowData;
}


export default function RentReport() {
    const rootCtx = useRootPageContext();
    const mainCtx = usePageRelatedContext();

    const [curMonthSelection, setCurMonthSelection] = useState<MonthSelections>('Y2D');
    const [selectedMonths, setSelectedMonths] = useState<string[]>(getMonthAry(curMonthSelection));
    const [curOwner, setCurOwner] = useState<IEditTextDropdownItem>({
        label: 'All',
        value: ''
    });
    const [allOwners, setAllOwners] = useState<{ label: string; value: string; }[]>([]);
    //const [allPaymentData, setAllPaymentData] = useState<IPaymentWithDateMonthPaymentType[]>([]);

    const [allRentReportData, setAllRentReportData] = useState<AllRentReportData>({});

    const [showDetail, setShowDetail] = useState<RentReportCellData | null>(null);   

    const loadData = async () => {        
        //if (selectedMonths.length === 0) return;

        mainCtx.showLoadingDlg('Loading Rent Report...');
        //const startDate = mainCtx.browserTimeToUTCDBTime(selectedMonths[0] + '-01');
        //const endDate = mainCtx.browserTimeToUTCDBTime(moment(selectedMonths[selectedMonths.length - 1] + '-01'));
        //console.log(`loadData for rent report startDate: ${startDate}, endDate: ${endDate}`);
        //const paymentData: IPaymentWithDateMonthPaymentType[] = await loadPayment(rootCtx, mainCtx, {
        //    whereArray: [
        //        {
        //            field: 'receivedDate',
        //            op: '>=',
        //            val: startDate,
        //        },
        //        {
        //            field: 'receivedDate',
        //            op: '<',
        //            val: endDate,
        //        }
        //    ],
        //});
        //setAllPaymentData(paymentData);
        const paymentData: IPaymentWithDateMonthPaymentType[] = await loadDataWithMonthRange(rootCtx, mainCtx, loadPayment, selectedMonths, 'receivedDate', 'Rent Payment');
        const ownerDc = paymentData.reduce((acc, pmt) => {
            const ownerName = pmt.addressObj?.ownerName;
            if (!acc.dict[ownerName]) {
                acc.owners.push(ownerName);
                acc.dict[ownerName] = true;
            }
            return acc;
        }, {
            dict: {} as { [owner: string]: boolean; },
            owners: [] as string[],
        });
        ownerDc.owners.sort((a, b) => a.localeCompare(b));
        setAllOwners([
            { label: 'All', value: '' },            
        ].concat(ownerDc.owners.map(o => ({
            label: o,
            value: o,
        }))));


        mainCtx.showLoadingDlg('');
        //const allHouses = mainCtx.getAllForeignKeyLookupItems('houseInfo') as IHouseInfo[];
        //selectedMonths

        const monthInfos = {
            monthAry: [] as string[],
            monthDict: {} as { [month: string]: boolean; },
        }
        const allRentReportData: AllRentReportData = paymentData.reduce((acc,pmt) => {            
            let houseMOnth = acc[pmt.houseID];
            if (!houseMOnth) {
                houseMOnth = {};
                acc[pmt.houseID] = houseMOnth;
            }
            let monthData = houseMOnth[pmt.month];
            if (!monthData) {   
                monthData = {
                    amount: 0,
                    payments: [],
                };
                houseMOnth[pmt.month] = monthData;
            }
            monthData.amount += pmt.amount;
            monthData.payments.push(pmt);


            if (!monthInfos.monthDict[pmt.month]) {                
                monthInfos.monthDict[pmt.month] = true;
                monthInfos.monthAry.push(pmt.month);                
            }
            return acc;
        }, {} as AllRentReportData);

        setAllRentReportData(allRentReportData);

        if (curMonthSelection === 'All') {
            monthInfos.monthAry.sort((a,b)=> -a.localeCompare(b));
            setSelectedMonths(monthInfos.monthAry);
        }
        
    }
    
    useEffect(() => {
        loadData();
    }, [curMonthSelection]);
    
    const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    const selectedHouses = allHouses.filter(h => (h.ownerName === curOwner.value || !curOwner.value) && h.disabled !== 'Y');
    return <div>
        <div className='divReportHeader'>Rent Report</div><br></br><br></br>
        <CloseableDialog show={!!showDetail} title='Item Details' setShow={() => setShowDetail(null)}>
                    <div className="modal-body">                        
                    <table>
                        {
                            orderBy((showDetail?.payments || [] ), 'receivedDate').map((d,tri) => {
                                return <tr key={tri}><td>{d.amount.toFixed(2)}</td><td>{d.date}</td> <td>{d.address}</td><td> {d.notes}</td> <td>{d.month}</td></tr>
                            })
        
                        }
                        </table>                        
                    </div>
                </CloseableDialog>
        <div className="row">
            <div className="col-sm-3">
                <EditTextDropdown
                                    items={['All', 'LastMonth', 'Last3Month', 'Y2D', 'LastYear'].map(value => ({
                                        value,
                                        label: value,
                                        selected: value === curMonthSelection
                                    }))}
                                    onSelectionChanged={sel => {
                                        setCurMonthSelection(sel.label as MonthSelections);
                                        setSelectedMonths(getMonthAry(sel.label as MonthSelections));
                                    }}
                            ></EditTextDropdown>
            </div>
            <div className="col-sm-3">
                <EditTextDropdown items={allOwners.map(o => ({
                    ...o,
                    selected: o.value === curOwner.value
                }))} onSelectionChanged={sel => {
                    //selected={state.curSelectedOwner} 
                    setCurOwner(sel);
                    }} curDisplayValue={curOwner.label}
                    opts={{ placeHolder: 'Select Owner' }}
                ></EditTextDropdown></div>        
        </div>
        <div className="row">
            <table className="table table-striped table-bordered table-hover">
                <thead>
                    <tr><th>Houses</th>{
                        selectedMonths.map(mon => <th key={mon}  className="text-end td-center">{mon}</th>)
                    }</tr>
                </thead>
                <tbody>
                    {
                        selectedHouses.map(house => {
                            return <tr key={house.houseID}><td>{house.address}</td>
                                {
                                    selectedMonths.map(mon => {
                                        const monthData = allRentReportData[house.houseID]?.[mon];
                                        const amt = monthData?.amount || 0;
                                        return <td key={mon} className="text-end td-center" onClick={() => {
                                            setShowDetail(monthData);
                                        }}>{amtDsp(amt)}</td>
                                    })
                                }
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    </div>
}



