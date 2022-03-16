import React, {useState} from 'react';
import { fMoneyformat, getIncomeExpensesContext } from '../../states/PaymentExpenseState';
import { MonthRange } from './monthRange';
import { getPaymentsByMonthAddress, getMaintenanceData, IAmountAndPmtRecords } from './reportUtil';
import moment from 'moment';
//import {saveToGS} from './utils/updateGS';
import { CloseableDialog} from '../../generic/basedialog'

export function CashFlowReport(props) {
    const ctx = getIncomeExpensesContext();
    const {payments, rawExpenseData, selectedHouses, monthes, paymentCalcOpts} = ctx;
    
    const monAddr = getPaymentsByMonthAddress(payments, paymentCalcOpts);

    const calculatedMaintData = getMaintenanceData(rawExpenseData, paymentCalcOpts);
    const [showDetail, setShowDetail] = useState(null);
    const [showExpenseDetail, setShowExpenseDetail] = useState(null);

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
        csvContent.push(['Expenses', '',...monthes.map(()=>'')]);


        [...calculatedMaintData.categoryNames].forEach(cat => {
            csvContent.push([cat, fMoneyformat(calculatedMaintData.categoryTotals[cat]),
                ...monthes.map(mon => fMoneyformat(calculatedMaintData.getCatMonth(cat, mon).amount))
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
    
    return <>
    <CloseableDialog show={!!showDetail} setShow={()=>setShowDetail(null)}>
    {(showDetail||[]).map(d => {
                    return <div>{d.amount.toFixed(2)} {d.date} {d.address} {d.notes} { d.debugText}</div>
                })}
        </CloseableDialog>            
        
        <CloseableDialog show={!!showExpenseDetail} setShow={() => {
            setShowExpenseDetail(null);
        }}>
            {(showExpenseDetail || []).map(d => {
                    return <div>{d.debugText}</div>
                })}
        </CloseableDialog>
        <MonthRange jjctx={{
            allMonthes: ctx.allMonthes,
            allHouses: ctx.allHouses,
            setCurMonthSelection: ctx.setCurMonthSelection, //type IEditTextDropdownItem
            selectedMonths: ctx.selectedMonths, setSelectedMonths: ctx.setSelectedMonths,
            selectedHouses: ctx.selectedHouses, setSelectedHouses: ctx.setSelectedHouses,
        }}></MonthRange>
        <table className='tableReport'>
            <thead>
            
                <td className='tdColumnHeader'>
                    <table><tr>
                        <td><input type="button" className="btn btn-secondary" onClick={() => saveCsvGS(true)}>CSV</input></td>
                        <td><input type="button" className="btn btn-secondary"onClick={() => saveCsvGS(false)}>Sheet</input></td>
                    </tr></table>                                    
                </td>
                <td className='tdColumnHeader'>Total</td>
                {
                    monthes.map((mon,key) => {
                        return <th className='tdColumnHeader' key={key}>{ mon}</th>
                    })
                }
                
            </thead>
            <tbody><tr>
                <td className='tdLeftSubHeader' colSpan={monthes.length + 2}>Income</td></tr>
                {
                    monAddr.houseAry.filter(h=>(selectedHouses[h.addressId] )).map((house,key) => {
                        return <tr key={key}>
                            <td className='tdLeftSubCategoryHeader'>{house.address}</td>
                            <td className='tdCenter  tdTotalItalic'>{fMoneyformat(house.total)}</td>
                            {
                                monthes.map((mon, key) => {
                                    const curHouseMon = (house.monthes[mon] || {} as IAmountAndPmtRecords);
                                    return < td key={key} className='tdCenter' onClick={() => setShowDetail(curHouseMon.records)}> {
                                        fMoneyformat(curHouseMon.amount)

                                    }</td>
                                })
                            }
                        </tr>
                    })
                }
                <tr><td>Non Rent</td></tr>
                {
                    monAddr.nonRentAry.map((nonRent, key) => {                        
                        return <tr key={key}>
                            <td className='tdLeftSubCategoryHeader'>{nonRent.displayName}</td>
                            <td className='tdCenter  tdTotalItalic' onClick={() => setShowDetail(nonRent.records)}>{fMoneyformat(nonRent.total)}</td>
                            {
                                monthes.map((mon, key) => {
                                    const curMon = (nonRent.monthes[mon] || {} as IAmountAndPmtRecords);
                                    return < td key={key} className='tdCenter' onClick={() => setShowDetail(curMon.records)}> {
                                        fMoneyformat(curMon.amount)

                                    }</td>
                                })
                            }
                        </tr>
                    })
                }
                <tr>

                <td className='tdLeftSubCategoryHeader'>Sub Total:
                </td><td className='tdCenter  tdTotalItalic'>{fMoneyformat(monAddr.total)}</td>
                {
                    monthes.map((name,key) => {
                        //const monDbg = paymentsByMonth[name];
                        const mon = monAddr.monthTotal[name];
                        // dbg={ monDbg?.total}
                        if (!mon && mon !== 0) return <td className='tdCenter  tdTotalItalic' key={key}></td>;
                        return <td className='tdCenter  tdTotalItalic' key={key}>{fMoneyformat(mon)}</td>
                    })
                    }</tr>
                
                <tr><td className='tdLeftSubHeader' colSpan={monthes.length+2}>Expenses</td></tr>
            
                
                {
                    [...calculatedMaintData.categoryNames].map((cat, key) => {
                        return <tr key={key}>
                            <td className='tdLeftSubCategoryHeader'>{cat}</td><td className="tdCenter  tdTotalItalic">{fMoneyformat(calculatedMaintData.categoryTotals[cat])}</td>
                            {
                                monthes.map((mon, key) => {
                                    const catMon = calculatedMaintData.getCatMonth(cat, mon);
                                    return <td key={key} className="tdCenter" onClick={() => {
                                        if (catMon.amountCalcParts) {
                                            console.log('catMon')
                                            console.log(catMon)
                                            const msgs = catMon.amountCalcParts.reduce((acc, r) => {
                                                console.log(r)
                                                if (r.calcInfo) {
                                                    r.calcInfo.forEach(i => acc.push({
                                                        debugText: i.info
                                                    }));
                                                }
                                                return acc;
                                            }, [
                                                {
                                                debugText: `For Total expense of ${catMon.amount.toFixed(2)}`
                                                },
                                                ...catMon.records.reduce((acc,r) => {
                                                    acc.push({
                                                        debugText: `=> ${r.amount} is from`
                                                    });
                                                    r.records.forEach(r => {
                                                        acc.push({
                                                            debugText: `===> ${moment(r.date).format('YYYY-MM-DD')} ${r.amount} ${r.comment} ${r.description}`
                                                        });
                                                    })
                                                    return acc;
                                                }, []),
                                                {
                                                    debugText:'====== breakdowns '
                                                }
                                            ]);
                                            setShowExpenseDetail(msgs)
                                        }
                                    }}>{fMoneyformat(catMon.amount)}</td>
                                })
                            }
                        </tr>
                    })
                }
                <tr><td className='tdLeftSubCategoryHeader'>Sub Total</td><td className="tdCenter  tdTotalItalic">{
                    fMoneyformat(calculatedMaintData.total)
                }</td>
                    {
                        monthes.map((mon,key) => {
                            return <td key={key} className="tdCenter tdTotalItalic">{fMoneyformat((calculatedMaintData.monthlyTotal[mon] || 0)) }</td>
                        })
                    }
                </tr>
                <tr>
                    <td colSpan={monthes.length+2}></td>
                </tr>
                <tr>
                    <td className="tdLeftSubHeader tdButtomTotalCell">Net Income</td>
                    <td className="tdCenter tdTotalBold">{fMoneyformat((monAddr.total - calculatedMaintData.total))}</td>
                    {
                        monthes.map((mon,key) => {
                            const incTotal = monAddr.monthTotal[mon] || 0; //paymentsByMonth[mon] || {};
                            //const incTotal = inc.total || 0;
                            const cost = calculatedMaintData.monthlyTotal[mon] || 0;
                            return <td key={key} className='tdButtomTotalCell tdTotalBold tdCenter t'>{fMoneyformat( (incTotal - cost))}</td>
                        })
                    }
                </tr>
            </tbody>
        </table>
    </>
}