
import React from 'react';
import ReactDOMServer from 'react-dom/server'
import { ITenantInfo } from '../reportTypes';
import { HouseWithLease } from './leaseUtil';
import { formatAccounting, standardFormatDate } from './reportUtils';


interface RenderProps {
    house: HouseWithLease;
    tenants: ITenantInfo[];
    contactEmail: string;
    contactPhone: string;
}

export function DirectEmailBodyContent(props: RenderProps) {    
    const leaseBalanceDueInfo = props.house.leaseBalanceDueInfo;
    const lastPaymentAmount = formatAccounting(leaseBalanceDueInfo.lastPaymentAmount);
    const lastPaymentDate = standardFormatDate(leaseBalanceDueInfo.lastPaymentDate);
    return <>
        <div>Dear {props.tenants.map(t => t.firstName).join(', ')}, <br />

            Your Rent Payment of {lastPaymentAmount} was received on {lastPaymentDate}.
            Here is your balance in details,
            <table>
                <tr><td colSpan={2}> Balance Forwarded </td><td>{ formatAccounting(leaseBalanceDueInfo.balanceForwarded)}</td > </tr>
                < tr > <td>Date </td><td>Transaction</td > <td>Amount </td></tr >
                {
                    leaseBalanceDueInfo.lastNPaymentAndDue.map((info, key)=>{
                        return <tr key={key}><td>{standardFormatDate(info.date)} </td><td>{info.paymentOrDueTransactionType}</td> <td>{ formatAccounting(info.paymentOrDueAmount)} </td></tr >
                    })
                }
                <tr><td colSpan={2} > Current Balance </td><td>{ formatAccounting(leaseBalanceDueInfo.totalBalance)}</td > </tr>
            </table>

            Please let me know if you have any questions or concerns.
            Thank you
            **************************************************************************************************************************
            This is an automatically generated email.Please do not reply, as this email address is not monitored.
            If you have any questions or concerns, feel free to contact us by email at {props.contactEmail} { props.contactPhone}.
            ********************************************************************************************************************** ****
        </div>
    </>
}


export function renderRenderBalanceEmailBodyToText(props: RenderProps) {
    return ReactDOMServer.renderToString(<DirectEmailBodyContent {...props}></DirectEmailBodyContent>)
}