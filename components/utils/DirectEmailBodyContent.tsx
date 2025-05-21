
import React from 'react';
import ReactDOMServer from 'react-dom/server'
import { ITenantInfo } from '../reportTypes';
import { HouseWithLease } from './leaseUtil';
import { formatAccounting, standardFormatDate } from './reportUtils';
import { TextAlignment } from 'pdf-lib';


interface RenderProps {
    house: HouseWithLease;
    tenants: ITenantInfo[];
    contactEmail: string;
    contactPhone: string;
    senderName: string;
}

export function DirectEmailBodyContent(props: RenderProps) {    
    const leaseBalanceDueInfo = props.house.leaseBalanceDueInfo;
    const lastPaymentAmount = formatAccounting(leaseBalanceDueInfo.lastPaymentAmount);
    const lastPaymentDate = standardFormatDate(leaseBalanceDueInfo.lastPaymentDate);
    return <>
        <div>Dear {props.tenants.map(t => t.firstName).join(', ')}, <br />

            Your Rent Payment of {lastPaymentAmount} was received on {lastPaymentDate}.<br></br>
            Here is your balance in details,<br></br>
            <table style={{ width: '60%', borderStyle: 'solid', borderBlockWidth: '1px', borderCollapse: 'collapse',   marginLeft: '15px', marginTop: '15px', marginRight:'15px', marginBottom:'15px',}}>
                < tr > <td style={{ borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px', }}>Date </td>
                <td style={{borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px', }}>Transaction</td >
                <td style={{borderStyle: 'solid', borderBlockWidth: '1px',  paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>Amount </td></tr >
                <tr><td colSpan={2} style={{ textAlign:'right',  borderStyle: 'solid', borderBlockWidth: '1px',  paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}> Previous Balance: </td>
                    <td style={{borderStyle: 'solid', borderBlockWidth: '1px',  paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>{ formatAccounting(leaseBalanceDueInfo.balanceForwarded)}</td > </tr>
                {
                    leaseBalanceDueInfo.lastNPaymentAndDue.map((info, key) => {
                        let amt = info.paymentOrDueAmount;
                        let type: string = info.paymentOrDueTransactionType;
                        if (info.paymentOrDueTransactionType === 'Payment') {
                            amt = -amt;
                        } else {
                            type = 'Rent Due';
                        }
                        return <tr key={key}><td style={{borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>{standardFormatDate(info.date)} </td>
                        <td style={{borderStyle: 'solid', borderBlockWidth: '0.5px',  paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>{type}</td> 
                        <td style={{borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>{ formatAccounting(amt)} </td></tr >
                    })
                }
                <tr><td colSpan={2} style={{ textAlign:'right', borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px', }}>Current Balance:</td>
                <td style={{borderStyle: 'solid', borderBlockWidth: '1px', paddingLeft:'15px', paddingRight:'15px', paddingTop:'15px', paddingBottom:'15px',}}>{ formatAccounting(leaseBalanceDueInfo.totalBalance)}</td > </tr>
                
            </table>
            <br></br>
            Other Deposit Information:<br></br>
            Security Deposit Received: { formatAccounting(props.house.lease.deposit)}<br></br>
            {
props.house.lease.petDeposit && <>Pet Depsoist Received: {formatAccounting(props.house.lease.petDeposit)}  (none refundable)<br></br>
</>
            }
            

            <br></br>Please let me know if you have any questions or concerns.<br></br>
            Thank you,<br></br>
             {props.senderName}<br></br><br></br>
            **************************************************************************************************************************<br></br>
            This is an automatically generated email. Please do not reply, as this email address is not monitored.<br></br>
            If you have any questions or concerns, feel free to contact us by email at {props.contactEmail} or text @ { props.contactPhone}.<br/>
            **************************************************************************************************************************
        </div>
    </>
}


export function renderRenderBalanceEmailBodyToText(props: RenderProps) {
    return ReactDOMServer.renderToString(<DirectEmailBodyContent {...props}></DirectEmailBodyContent>)
}