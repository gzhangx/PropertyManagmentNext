import React, { useEffect, useState } from 'react';
import { fMoneyformat, useIncomeExpensesContext } from '../../states/PaymentExpenseState';
import { MonthRange } from './monthRange';
import { getPaymentsByMonthAddress, getMaintenanceData, getMaintenanceDataByWorker, IMaintenanceDataByWorkerMonthRes, IMaintenanceMonthWorkerAmtRec } from './reportUtil';
//import {saveToGS} from './utils/updateGS';
import { CloseableDialog } from '../../generic/basedialog'
import { usePageRelatedContext } from '../../states/PageRelatedState';

export function ExpenseByWorkerReport() {
    const mainCtx = usePageRelatedContext();
    const ctx = useIncomeExpensesContext();
    const { payments, rawExpenseData, selectedHouses, monthes, paymentCalcOpts } = ctx;

    paymentCalcOpts.isGoodWorkerId = () => true;
    const monAddr = getPaymentsByMonthAddress(payments, paymentCalcOpts);


    const calculatedMaintData = getMaintenanceDataByWorker(rawExpenseData, paymentCalcOpts);
    const [showDetail, setShowDetail] = useState(null);
    const [showExpenseDetail, setShowExpenseDetail] = useState(null);

    useEffect(() => {
        mainCtx.loadForeignKeyLookup('workerInfo');
    }, []);
    const getWorkerMon = (workerID: string, mon: string) => {
        const def = {} as IMaintenanceMonthWorkerAmtRec;
        const wkr = calculatedMaintData.byWorkerByMonth[workerID];
        if (!wkr) return def;
        return wkr[mon] || def;
    }

    const saveCsvGS = csv => {
        var link = document.createElement("a");
        const csvContent = [];

        const fMoneyformat = d => (d || d === 0) ? d.toFixed(2) : '';
        csvContent.push(['', 'Total', ...monthes]);
        monAddr.houseAry.filter(h => (selectedHouses[h.addressId])).forEach((house, key) => {
            csvContent.push([house.address, fMoneyformat(house.total),
            ...monthes.map(mon => fMoneyformat((house.monthes[mon] || {}).amount))
            ]);
        })
        csvContent.push(['Non Rent']);
        monAddr.nonRentAry.forEach(nonRent => {
            csvContent.push([nonRent.displayName, fMoneyformat(nonRent.total),
            ...monthes.map(mon => fMoneyformat((nonRent.monthes[mon] || {}).amount))
            ])
        })
        csvContent.push(['Sub Total:', fMoneyformat(monAddr.total),
            ...monthes.map((name, key) => {
                const mon = monAddr.monthTotal[name];
                if (!mon && mon !== 0) return '';
                return fMoneyformat(mon);
            })
        ]);

        csvContent.push(['']);
        csvContent.push(['Expenses', '', ...monthes.map(() => '')]);


        [...calculatedMaintData.workerIDs].forEach(cat => {
            csvContent.push([cat, fMoneyformat(calculatedMaintData.workerTotals[cat]),
                ...monthes.map(mon => fMoneyformat(getWorkerMon(cat, mon).totalAmountWokerMonth))
            ])

        })

        csvContent.push(['Sub Total', fMoneyformat(calculatedMaintData.total),
            ...monthes.map(mon => fMoneyformat((calculatedMaintData.monthlyTotal[mon] || 0)))
        ])

        csvContent.push(['']);
        csvContent.push(['Net Income', fMoneyformat((monAddr.total - calculatedMaintData.total)),
            ...monthes.map(mon => {
                const incTotal = monAddr.monthTotal[mon] || 0;
                const cost = calculatedMaintData.monthlyTotal[mon] || 0;
                return fMoneyformat((incTotal - cost));
            })
        ]);


        if (csv) {
            link.href = window.URL.createObjectURL(
                new Blob([csvContent.map(c => c.join(', ')).join('\n')], { type: "application/txt" })
            );
            link.download = `report-cashflow.csv`;

            document.body.appendChild(link);
            link.click();
            setTimeout(function () {
                window.URL.revokeObjectURL(link.href);
            }, 200);
        } else {
            //saveToGS(csvContent)
        }
    }

    

    return <div>
        <CloseableDialog show={!!showDetail} setShow={() => setShowDetail(null)}>
            {(showDetail || []).map(d => {
                return <div>{d.amount.toFixed(2)} {d.date} {d.address} {d.notes} {d.debugText}</div>
            })}
        </CloseableDialog>

        <CloseableDialog show={!!showExpenseDetail} setShow={() => {
            setShowExpenseDetail(null);
        }}>
            {(showExpenseDetail || []).map(d => {
                return <div>{d.debugText}</div>
            })}
        </CloseableDialog>
        <div className="modal-body">
            <div className='row'>
                <MonthRange jjctx={{
                    allMonthes: ctx.allMonthes,
                    allHouses: ctx.allHouses,
                    setCurMonthSelection: ctx.setCurMonthSelection, //type IEditTextDropdownItem
                    selectedMonths: ctx.selectedMonths, setSelectedMonths: ctx.setSelectedMonths,
                    selectedHouses: ctx.selectedHouses, setSelectedHouses: ctx.setSelectedHouses,
                }}></MonthRange>
            </div>
            <div className='row'>
                <table className='table'>
                    <thead>
                        <tr>
                            <td className='tdColumnHeader'>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td><button type="button" className="btn btn-secondary" onClick={() => saveCsvGS(true)}>CSV</button></td>
                                            <td><button type="button" className="btn btn-secondary" onClick={() => saveCsvGS(false)}>Sheet</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td className='tdColumnHeader'>Total</td>
                            {
                                monthes.map((mon, key) => {
                                    return <th className='tdColumnHeader' key={key}>{mon}</th>
                                })
                            }
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td className='h3' colSpan={monthes.length + 2}>Expenses</td></tr>


                        {
                            [...calculatedMaintData.workerIDs].map((cat, key) => {
                                const workerInfo = mainCtx.foreignKeyLoopkup.get('workerInfo');
                                const workerName = workerInfo?.idDesc.get(cat)?.desc || cat;
                                return <tr key={key}>
                                    <td className='tdLeftSubCategoryHeader'>{workerName}</td><td className="tdCenter  tdTotalItalic">{fMoneyformat(calculatedMaintData.workerTotals[cat])}</td>
                                    {
                                        monthes.map((mon, key) => {
                                            const catMon = getWorkerMon(cat, mon);
                                            return <td key={key} className="tdCenter" onClick={() => {
                                            }}>{fMoneyformat(catMon.totalAmountWokerMonth)}</td>
                                        })
                                    }
                                </tr>
                            })
                        }
                        <tr><td className='tdLeftSubCategoryHeader'>Sub Total</td><td className="tdCenter  tdTotalItalic">{
                            fMoneyformat(calculatedMaintData.total)
                        }</td>
                            {
                                monthes.map((mon, key) => {
                                    return <td key={key} className="tdCenter tdTotalItalic">{fMoneyformat((calculatedMaintData.monthlyTotal[mon] || 0))}</td>
                                })
                            }
                        </tr>
                        <tr>
                            <td colSpan={monthes.length + 2}></td>
                        </tr>
                        <tr>
                            <td className="tdLeftSubHeader tdButtomTotalCell">Net Income</td>
                            <td className="tdCenter tdTotalBold">{fMoneyformat((monAddr.total - calculatedMaintData.total))}</td>
                            {
                                monthes.map((mon, key) => {
                                    const incTotal = monAddr.monthTotal[mon] || 0; //paymentsByMonth[mon] || {};
                                    //const incTotal = inc.total || 0;
                                    const cost = calculatedMaintData.monthlyTotal[mon] || 0;
                                    return <td key={key} className='tdButtomTotalCell tdTotalBold tdCenter t'>{fMoneyformat((incTotal - cost))}</td>
                                })
                            }
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}