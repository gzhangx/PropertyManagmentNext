import React, { useState, useEffect } from "react";

import { EditTextDropdown  } from '../../components/generic/EditTextDropdown';
import {    
    IExpenseData,
    IHouseInfo,
} from '../../components/reportTypes';

import moment from 'moment'
import { usePageRelatedContext } from "../../components/states/PageRelatedState";
import { useRootPageContext } from "../../components/states/RootState";
import { IEditTextDropdownItem } from "../../components/generic/GenericDropdown";
import { CloseableDialog } from "../../components/generic/basedialog";
import { orderBy } from "lodash";
import { getMonthAry, IPaymentWithDateMonthPaymentType, loadDataWithMonthRange, loadMaintenanceData, loadPayment, MonthSelections } from "../../components/utils/reportUtils";


const amtDsp = (amt: number) => {
    if (!amt) return 0;
    return amt.toFixed(2);
}





type RentReportCellData = {
    amount: number;
    payments: IPaymentWithDateMonthPaymentType[];
}

type RentReportIncomeExpenseRowData = {
    income: { [paymentType: string]: RentReportCellData };
}

type AllRentReportData = {
    [houseID: string]: RentReportIncomeExpenseRowData;
}


type ExpenseCellData = {
    amount: number;
    expenses: IExpenseData[];
}
type RentReportExpenseRowData = {
    expense: { [paymentType: string]: ExpenseCellData };
}
type ExpenseReportData = {
    [houseID: string]: RentReportExpenseRowData;
}

export default function CashFlowReport() {
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
    const [expenseReportData, setExpenseReportData] = useState<ExpenseReportData>({});
    const [expenseCats, setExpenseCats] = useState<string[]>([]);

    const [showDetail, setShowDetail] = useState<RentReportCellData | null>(null);   

    const[paymentTypes, setPaymentTypes] = useState<string[]>([]);

    const loadData = async () => {        
        if (selectedMonths.length === 0) return;
        
        
        const paymentData: IPaymentWithDateMonthPaymentType[] = await loadDataWithMonthRange(rootCtx, mainCtx, loadPayment, selectedMonths, 'receivedDate', 'Rent Payment');
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

        
        //const allHouses = mainCtx.getAllForeignKeyLookupItems('houseInfo') as IHouseInfo[];
        //selectedMonths        
        
        const allRentReportDataAndMisc = paymentData.reduce((acc,pmt) => {            
            let houseIcomExp = acc.rptData[pmt.houseID];
            if (!houseIcomExp) {
                houseIcomExp = {
                    income: {},
                };
                acc.rptData[pmt.houseID] = houseIcomExp;
            }
            let pmpTypeData = houseIcomExp.income[pmt.paymentTypeName];
            if (!pmpTypeData) {   
                pmpTypeData = {
                    amount: 0,
                    payments: [],
                };
                houseIcomExp.income[pmt.paymentTypeName] = pmpTypeData;
            }
            pmpTypeData.amount += pmt.amount;
            pmpTypeData.payments.push(pmt);

            if (!acc.paymentTypeData.existing[pmt.paymentTypeName]) {
                acc.paymentTypeData.paymentTypes.push(pmt.paymentTypeName);
                acc.paymentTypeData.existing[pmt.paymentTypeName] = true;
            }
            return acc;
        }, {
            rptData: {} as AllRentReportData,
            paymentTypeData: {
                existing: {},
                paymentTypes: [] as string[],
            } as { 
                existing: { [paymentType: string]: boolean; };
                paymentTypes: string[];
            } ,
        });

        setAllRentReportData(allRentReportDataAndMisc.rptData);
        setPaymentTypes(allRentReportDataAndMisc.paymentTypeData.paymentTypes);
    }


    async function loadExpenseData() {
        const expenseData: IExpenseData[] = await loadDataWithMonthRange(rootCtx, mainCtx, loadMaintenanceData, selectedMonths, 'date', 'ExpenseData');
        const expenseRes = expenseData.reduce((acc, exp) => {
            let houseExp = acc.expenseData[exp.houseID];
            if (!houseExp) {
                houseExp = {
                    expense: {},
                };
                acc.expenseData[exp.houseID] = houseExp;
            }

            let expCatData = houseExp.expense[exp.expenseCategoryName];
            if (!expCatData) {
                expCatData = {
                    amount: 0,
                    expenses: [],
                };
                houseExp.expense[exp.expenseCategoryName] = expCatData;
            }

            expCatData.amount += exp.amount;
            expCatData.expenses.push(exp);

            if (!acc.expenseCatData.existing[exp.expenseCategoryName]) {
                acc.expenseCatData.expenseCats.push(exp.expenseCategoryName);
                acc.expenseCatData.existing[exp.expenseCategoryName] = true;
            }
            return acc;
        }, {
            expenseData: {} as ExpenseReportData,
            expenseCatData: {
                existing: {} as { [expenseCat: string]: boolean; },
                expenseCats: [] as string[],
            }
        });

        setExpenseReportData(expenseRes.expenseData);
        setExpenseCats(expenseRes.expenseCatData.expenseCats.sort());
    }

    async function loadAll() {
        await mainCtx.checkLoadForeignKeyForTable('maintenanceRecords');
        await loadData();
        await loadExpenseData();
        mainCtx.showLoadingDlg('');        
    }
    useEffect(() => {
        mainCtx.showLoadingDlg('Loading Rent Report...');
        loadAll();
    }, [selectedMonths.join(',')]);
    
    const allHouses = (mainCtx.getAllForeignKeyLookupItems('houseInfo') || []) as IHouseInfo[];
    return <div>
        <CloseableDialog show={!!showDetail} title='Item Details' setShow={() => setShowDetail(null)}>
                    <div className="modal-body">                        
                    <table>
                        {
                            orderBy((showDetail?.payments || [] ), 'receivedDate').map((d,tri) => {
                                return <tr key={tri}><td>{d.amount.toFixed(2)}</td><td>{d.date}</td> <td>{d.paymentTypeName}</td><td> {d.notes}</td> <td>{d.month}</td></tr>
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
                    <tr><th colSpan={allHouses.filter(h => h.ownerName === curOwner.value || !curOwner.value).length + 1}>Income</th></tr>
                </thead>
                <thead>
                    <tr><th>Houses</th>{
                        allHouses.filter(h => h.ownerName === curOwner.value || !curOwner.value).map(house => <th>{house.address}</th>)
                    }</tr>
                </thead>
                <tbody>
                    {
                        paymentTypes.map((pType, i) => {
                            return <tr key={i}><td>{pType}</td>
                                {
                                    allHouses.filter(h => h.ownerName === curOwner.value || !curOwner.value).map(house => {
                                        const monthData = allRentReportData[house.houseID]?.income[pType];
                                        const amt = monthData?.amount || 0;
                                        return <td key={house.houseID} className="text-end" onClick={() => {
                                            setShowDetail(monthData);
                                        }}>{amtDsp(amt)}</td>
                                    })
                                }
                            </tr>
                        })
                    }                    
                </tbody>
                <thead></thead>
                <thead>
                    <tr><th colSpan={allHouses.filter(h => h.ownerName === curOwner.value || !curOwner.value).length + 1}>Expenses</th></tr>
                </thead>
                <tbody>
                    {
                        expenseCats.map((expCat, i) => {
                            return <tr key={i}><td>{expCat}</td>
                                {
                                    allHouses.filter(h => h.ownerName === curOwner.value || !curOwner.value).map(house => {
                                        const aggData = expenseReportData[house.houseID]?.expense[expCat];
                                        const amt = aggData?.amount || 0;
                                        return <td key={house.houseID} className="text-end" onClick={() => {
                                            //setShowDetail(aggData);
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



