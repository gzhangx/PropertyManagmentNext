
import React from 'react';
import ReactDOMServer from 'react-dom/server'
import { ITenantInfo } from '../reportTypes';
import { HouseWithLease } from './leaseUtil';
import { formatAccounting, standardFormatDate } from './reportUtils';
import { TextAlignment } from 'pdf-lib';
import { last } from 'lodash';


interface RenderProps {
    house: HouseWithLease;
    tenants: ITenantInfo[];
    contactEmail: string;
    contactPhone: string;
    senderName: string;
}

export function DirectEmailBodyContent(props: RenderProps) {    
    const leaseBalanceDueInfo = props.house.leaseBalanceDueInfo;
    if (!leaseBalanceDueInfo) return null;
    if (!props.house.lease) return;
    const lastPaymentAmount = formatAccounting(leaseBalanceDueInfo.lastPaymentAmount);
    const lastPaymentDate = standardFormatDate(leaseBalanceDueInfo.lastPaymentDate);
    const emailtableCss:React.CSSProperties = {
         borderCollapse: 'collapse', borderStyle: 'solid', borderWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',
    };
    const emailTableWidth:React.CSSProperties= 
    {
        ...emailtableCss, width:'60%'
    };

     const emailTableTitle:React.CSSProperties= 
    {
        ...emailtableCss, 
    };

    const lastLeaseDue = leaseBalanceDueInfo.paymnetDuesInfo[leaseBalanceDueInfo.paymnetDuesInfo.length - 1];    
    let leaseDueSeg: React.JSX.Element | null = null;
    if (lastLeaseDue) {
        let prevSeg = lastLeaseDue;
        //assuming it is due
        let dueOrPaymentSeg = <tr style={emailtableCss}>
                    <td style={emailtableCss}>{standardFormatDate(lastLeaseDue.date)} </td>
                    <td style={emailtableCss}>{lastLeaseDue.paymentOrDueTransactionType}</td>
                    <td style={emailtableCss}>{formatAccounting(lastLeaseDue.paymentOrDueTransactionType === 'Payment'?
                    -lastLeaseDue.paymentOrDueAmount
                :lastLeaseDue.paymentOrDueAmount)} </td>
                </tr >
        let confirmedDueSeg : React.JSX.Element | null = null;
        if (lastLeaseDue.paymentOrDueTransactionType === 'Payment') {
            //but if it is payment, need to lookup for one more due
            const possibleDue = leaseBalanceDueInfo.paymnetDuesInfo[leaseBalanceDueInfo.paymnetDuesInfo.length - 2];            
            if (possibleDue && possibleDue.paymentOrDueTransactionType === 'Due') {
                prevSeg = possibleDue;
                confirmedDueSeg = <tr style={emailtableCss}>
                    <td style={emailtableCss}>{standardFormatDate(possibleDue.date)} </td>
                    <td style={emailtableCss}>{possibleDue.paymentOrDueTransactionType}</td>
                    <td style={emailtableCss}>{formatAccounting(possibleDue.paymentOrDueAmount)} </td>
                </tr >
            }
        }
        leaseDueSeg = <>
            <tr style={emailtableCss}>
                <td colSpan={2} style={{ textAlign: 'right', }}> Previous Balance: </td>
                <td style={emailtableCss}> {formatAccounting(prevSeg.previousBalance)}</td >
            </tr >
            {
                confirmedDueSeg
            }
            {
                dueOrPaymentSeg
            }
            <tr style={emailtableCss}>
                <td colSpan={2} style={emailtableCss}>Current Balance:</td>
                <td style={emailtableCss}>{formatAccounting(lastLeaseDue.newBalance)}</td >
            </tr>
        </>
    }
      return <>
        <div>Dear {props.tenants.map(t => t.firstName).join(' and  ')}, <br /><br></br>

            Your Rent Payment of {lastPaymentAmount} was received on {lastPaymentDate}.<br></br><br></br>

            {

               (leaseBalanceDueInfo.totalBalance > 0) && <>
            Here is your balance in details, <br></br><br></br>
            <table style={emailTableWidth}>
                < tr style={emailtableCss}>
                    <td style={emailtableCss}>Date </td>
                    <td style={emailtableCss}>Transaction</td >
                    <td style={emailtableCss}>Amount </td>
                </tr >
                    {
                        leaseDueSeg
                    }                
                
            </table>
            <br></br>
            <b>Other Deposit Information:</b><br></br>
            Security Deposit Received: { formatAccounting(props.house.lease.deposit)}<br></br>
            {
props.house.lease.petDeposit && <>Pet Depsoist Received: {formatAccounting(props.house.lease.petDeposit)} <br></br>
</>
            }
           

            <br></br>Please let me know if you have any questions or concerns.<br></br>
             </>}
            Thank you,<br></br>
             {props.senderName}<br></br><br></br>
            **************************************************************************************************************************<br></br>
            This is an automatically generated email. Please do not reply, as this email address is not monitored.<br></br>
            If you have any questions or concerns, feel free to contact us by email at {props.contactEmail} or text @ { props.contactPhone}.<br/>
            **************************************************************************************************************************
        
   </div> </>
}


export function renderRenderBalanceEmailBodyToText(props: RenderProps) {
    return ReactDOMServer.renderToString(<DirectEmailBodyContent {...props}></DirectEmailBodyContent>)
}