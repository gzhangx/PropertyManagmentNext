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
import { DoubleAryToCsv, formatAccounting, getMonthAry, IPaymentWithDateMonthPaymentType, loadDataWithMonthRange, loadMaintenanceData, loadPayment, MonthSelections } from "../../components/utils/reportUtils";
import { round2 } from "../../components/report/util/utils";
import { CreateSaveButton } from "../../components/generic/SaveFile";
import { MiddlewareNotFoundError } from "next/dist/shared/lib/utils";


const amtDsp = (amt: number) => {
    if (!amt) return 0;
    return formatAccounting(amt);
}





type RentReportCellData = {
    amount: number;
    payments: IPaymentWithDateMonthPaymentType[];
}

type RentReportIncomeExpenseRowData = {
    income: { [paymentType: string]: RentReportCellData };
    totalIncome: number;
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
    totalExpense: number;
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
                    totalIncome: 0,
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
            pmpTypeData.amount = round2(pmpTypeData.amount + pmt.amount);
            pmpTypeData.payments.push(pmt);
            houseIcomExp.totalIncome = round2(houseIcomExp.totalIncome + pmt.amount);

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
                    totalExpense: 0,
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

            expCatData.amount = round2(expCatData.amount + exp.amount);
            houseExp.totalExpense = round2(houseExp.totalExpense + exp.amount);
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
    const selectedHouses = allHouses.filter(h => (h.ownerName === curOwner.value || !curOwner.value) && h.disabled !== 'Y');
    const incomeTotals: number[] = new Array(selectedHouses.length + 1).fill(0);
    const expenseTotals: number[] = new Array(selectedHouses.length + 1).fill(0);
    selectedHouses.forEach((house, i) => {
        if (!allRentReportData[house.houseID]) return;
        const allHouseIncome = allRentReportData[house.houseID].totalIncome;
        incomeTotals[i + 1] = allHouseIncome;
        incomeTotals[0] = round2(incomeTotals[0] + allHouseIncome);

        if (!expenseReportData[house.houseID]) return;
        const allHouseExpense = expenseReportData[house.houseID].totalExpense;
        expenseTotals[i + 1] = allHouseExpense;
        expenseTotals[0] = round2(expenseTotals[0] + allHouseExpense);
    });


    const arrayDisplayData = generateExportArray(selectedHouses, paymentTypes, allRentReportData, incomeTotals, expenseCats, expenseReportData, expenseTotals);
    
    const exportData: string[][] = [
        ['Income'],
        ...arrayDisplayData.incomeArray.map(row => row.map(cell => cell.amount?.toString() || cell.display)),
        ['Expenses'],
        ...arrayDisplayData.expenseArray.map(row => row.map(cell => cell.amount?.toString() ||cell.display)),

        arrayDisplayData.grandTotal.map(cell => cell.amount?.toString() ||cell.display),
    ] 
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
            <div className="col-sm-3">
                            {
                                <CreateSaveButton content={DoubleAryToCsv(exportData)} />
                            }
                        </div>
        </div>
        <div className="row">
            <table className="table table-striped table-bordered table-hover table-border">
                
                <thead>
                    <tr><th style={{verticalAlign:"middle"}}>Houses</th>
                    <th className='accounting-alright' style={{verticalAlign:"middle"}}>Total</th>{
                        selectedHouses.map(house => <th className='accounting-alright' style={{textAlign:"center", verticalAlign:"middle"}}>{house.address}</th>)
                    }</tr>
                </thead>   
                <thead>
                    <tr><th colSpan={selectedHouses.length + 2} className='td-italic'> Income</th></tr>
                </thead>             
                <tbody>                                        
                    {
                        arrayDisplayData.incomeArray.slice(1).map((cells, i) => {
                            return <tr key={'tr' + i}>{
                                cells.map((cell, j) => {
                                    return <td key={'td' + i + j} className={j === 0 ? '' : 'accounting-alright'}>{cell.display}</td>
                                })
                            }</tr>
                        })
                    }

                </tbody>
                <thead></thead>
                <thead>
                    <tr><th colSpan={selectedHouses.length + 2} className='td-italic'>Expenses</th></tr>
                </thead>
                <tbody>

                    {
                        //This is the by expense category and last row is total columns
                            arrayDisplayData.expenseArray.map((cells, i) => {
                                return <tr key={'tr' + i}>{
                                    cells.map((cell, j) => {
                                        return <td key={'td' + i + j} className={j === 0 ? '' : 'accounting-alright'}>{cell.display}</td>
                                    })
                                }</tr>
                            })
                        }
                    <tr>
                        {
                            //Grand Total column generated by generateExportArray
                            arrayDisplayData.grandTotal.map((total, i) => {                                
                                return <td key={i} className={i === 0?'':'accounting-alright'}>{total.display}</td>
                            })
                        }
                    </tr>
                </tbody>
                <thead>                    
                    
                </thead>
            </table>
        </div>
    </div>
}



type DspCellData = {
    display: string;
    amount?: number;
    paymentInfo?: RentReportCellData
    expenseInfo?: ExpenseCellData;
}

function generateExportArray(selectedHouses: IHouseInfo[], paymentTypes: string[], allRentReportData: AllRentReportData,
    incomeTotals: number[],
    expenseCats: string[], expenseReportData: ExpenseReportData, expenseTotals: number[]
) {
    const incomeArray: DspCellData[][] = [];
    incomeArray.push(['', 'Total'].concat(selectedHouses.map(house => house.address)).map(display => ({ display })));
    paymentTypes.map((pType, i) => {
        const total = selectedHouses.reduce((acc, house) => {
            const monthData = allRentReportData[house.houseID]?.income[pType];
            const amt = monthData?.amount || 0;
            acc = round2(acc + amt);
            return acc;
        }, 0);
        incomeArray.push([
            {
                display: pType,
            },
            {
                display: amtDsp(total).toString(),
                amount: total,
            },
            ...selectedHouses.map(house => {
                const monthData = allRentReportData[house.houseID]?.income[pType];
                const amt = monthData?.amount || 0;
                return {
                    display: amtDsp(amt).toString(),
                    amount: amt,
                    paymentInfo: monthData,
                }
            })
        ]);
        incomeArray.push([
            { display: 'Total' },
            ...incomeTotals.map((total) => {
                return {
                    display: amtDsp(total).toString(),
                    amount: total
                }
            })
        ]);
    });

    const expenseArray: DspCellData[][] = expenseCats.map((expCat, i) => {
        const total = selectedHouses.reduce((acc, house) => {
            const aggData = expenseReportData[house.houseID]?.expense[expCat];
            const amt = aggData?.amount || 0;
            acc = round2(acc + amt);
            return acc;
        }, 0);
        return [{ display: expCat },
        {
            display: amtDsp(total).toString(),
            amount: total,
        },
        ...selectedHouses.map(house => {
            const aggData = expenseReportData[house.houseID]?.expense[expCat];
            const amt = aggData?.amount || 0;

            return {
                display: amtDsp(amt).toString(),
                amount: amt,
                expenseInfo: aggData,
            }
        })
        ]
    });
    expenseArray.push([
        { display: 'Total' },
        ...expenseTotals.map((total, i) => {
            return {
                display: amtDsp(total).toString(),
                amount: total,
            }
        })
    ]);

    return {
        incomeArray,
        expenseArray,
        grandTotal: [{
            display: 'Grand Total',
        }].concat(incomeTotals.map((total, i) => {
            const amount = round2(total - expenseTotals[i]);
            return {
                display: amtDsp(amount).toString(),
                amount,
            }
        })) as DspCellData[],
    }
}
