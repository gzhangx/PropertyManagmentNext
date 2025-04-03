import React, { useState, useEffect } from "react";

import { EditTextDropdown  } from '../../components/generic/EditTextDropdown';
import {    
    IPayment,
    IPageRelatedState,
    IHelperOpts,
    IHouseInfo,
} from '../../components/reportTypes';

import moment from 'moment'
import { round2 } from "../../components/report/util/utils";
import { usePageRelatedContext } from "../../components/states/PageRelatedState";
import { createAndLoadHelper } from "../../components/uidatahelpers/datahelpers";
import { IRootPageState, useRootPageContext } from "../../components/states/RootState";
import { IDBFieldDef } from "../../components/types";
import { IEditTextDropdownItem } from "../../components/generic/GenericDropdown";
import { all } from "bluebird";
import { CloseableDialog } from "../../components/generic/basedialog";
import { orderBy } from "lodash";

interface IShowDetailsData {
    amount: number;
    address: string;
    houseID: string;
    notes: string;
    date: string;
}



const amtDsp = (amt: number) => {
    if (!amt) return 0;
    return amt.toFixed(2);
}




export type IPaymentWithDateMonthPaymentType = IPayment & {
    date: string;
    month: string;
    paymentTypeName: string;
    address: string;
    addressObj: IHouseInfo;
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

export async function loadPayment(rootCtx: IRootPageState, mainCtx: IPageRelatedState, opts: IHelperOpts) {
    const helper = await createAndLoadHelper(rootCtx, mainCtx, {
        table: 'rentPaymentInfo'
    });
    await helper.loadModel();
    const fieldToDefDict = helper.getModelFields().reduce((acc, f) => {
        acc[f.field] = f;
        return acc;
    }, {} as {[field: string]: IDBFieldDef});
    await mainCtx.checkLoadForeignKeyForTable('rentPaymentInfo');
    
    const paymentData: IPaymentWithDateMonthPaymentType[] = await helper.loadData(opts).then(async res => {        
        return res.rows.map(r => {
            const paymentTypeName = r.paymentTypeName || r.paymentTypeID;
            const date = mainCtx.utcDbTimeToZonedTime(r.receivedDate);

            const pmt: IPaymentWithDateMonthPaymentType = {
                ...r,
                paymentTypeName,
                date,
                month: moment(date).format('YYYY-MM'),
                amount: r.receivedAmount,
            };
            ['receivedDate'].forEach(f => {
                const tmField = fieldToDefDict['houseID'];
                if (tmField.foreignKey && tmField.foreignKey.resolvedToField) {
                    const houseInfo = mainCtx.translateForeignLeuColumnToObject(tmField, r);
                    pmt[tmField.foreignKey.resolvedToField] = houseInfo as IHouseInfo;

                    if (typeof houseInfo === 'string') {
                        pmt.address = 'NonReslvedAddr ' + houseInfo
                    } else {
                        pmt.address = houseInfo.address as string;
                    }
                }
            });            
            return pmt;
        })
    });
    return paymentData;
}

export default function RentReport() {
    const rootCtx = useRootPageContext();
    const mainCtx = usePageRelatedContext();

    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [curMonthSelection, setCurMonthSelection] = useState<MonthSelections>('Y2D');
    const [curOwner, setCurOwner] = useState<IEditTextDropdownItem>({
        label: 'All',
        value: ''
    });
    const [allOwners, setAllOwners] = useState<{ label: string; value: string; }[]>([]);
    //const [allPaymentData, setAllPaymentData] = useState<IPaymentWithDateMonthPaymentType[]>([]);

    const [allRentReportData, setAllRentReportData] = useState<AllRentReportData>({});

    const [showDetail, setShowDetail] = useState<RentReportCellData | null>(null);   

    const loadData = async () => {        
        if (selectedMonths.length === 0) return;

        mainCtx.showLoadingDlg('Loading Rent Report...');
        const startDate = mainCtx.browserTimeToUTCDBTime(selectedMonths[0] + '-01');
        const endDate = mainCtx.browserTimeToUTCDBTime(moment(selectedMonths[selectedMonths.length - 1] + '-01'));
        console.log(`loadData for rent report startDate: ${startDate}, endDate: ${endDate}`);
        const paymentData: IPaymentWithDateMonthPaymentType[] = await loadPayment(rootCtx, mainCtx, {
            whereArray: [
                {
                    field: 'receivedDate',
                    op: '>=',
                    val: startDate,
                },
                {
                    field: 'receivedDate',
                    op: '<',
                    val: endDate,
                }
            ],
        });
        //setAllPaymentData(paymentData);
        
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

        paymentData.forEach(pmt => {            
            let houseMOnth = allRentReportData[pmt.houseID];
            if (!houseMOnth) {
                houseMOnth = {};
                allRentReportData[pmt.houseID] = houseMOnth;
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
        });

        setAllRentReportData(allRentReportData);
        
    }
    useEffect(() => {
        loadData();
    }, [selectedMonths.join(',')]);
    
    const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    return <div>
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
                    <tr><td>HouseName</td>{
                        selectedMonths.map(mon => <td key={mon}>{mon}</td>)
                    }</tr>
                </thead>
                <tbody>
                    {
                        allHouses.filter(h=>h.ownerName === curOwner.value || !curOwner.value).map(house => {
                            return <tr key={house.houseID}><td>{house.address}</td>
                                {
                                    selectedMonths.map(mon => {
                                        const monthData = allRentReportData[house.houseID]?.[mon];
                                        const amt = monthData?.amount || 0;
                                        return <td key={mon} className="text-end">{amtDsp(amt)}</td>
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





type MonthSelections = 'LastMonth' | 'Last3Month' | 'Y2D' | 'LastYear' | 'All';
function getMonthAry(monSel: MonthSelections) {
    
    let lm: string;
    switch (monSel) {
        case 'LastMonth':
            return [moment().subtract(1, 'month').format('YYYY-MM')];
        case 'Last3Month':
            return [0, 1, 2].map(sub => moment().subtract(sub, 'month').format('YYYY-MM'))
                                        
        case 'Y2D':
            {
                let start = moment().startOf('year');
                const now = moment();
                const result: string[] = [];
                while (start.isSameOrBefore(now)) {
                    result.push(start.format('YYYY-MM'));
                    start.add(1, 'month');
                }
                return result;
            }
        case 'LastYear':
            {
                const end = moment().startOf('year');
                const start = moment().subtract(1, 'year').endOf('year');
                const result: string[] = [];
                while (start.isBefore(end)) {
                    result.push(start.format('YYYY-MM'));
                    start.add(1, 'month');
                }
                break;
            }
        default:
            return [];
    }
}