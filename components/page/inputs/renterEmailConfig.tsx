import { useEffect, useState } from "react";
import * as api from '../../api'
import { getPaymentEmailConfig, getPaymentEmailDesc, googleSmtpPass, googleSmtpUser, IPaymentEmailConfig, paymentEmailProps, paymentEmailSubject, paymentEmailText } from "../../utils/leaseEmailUtil";



export function RenterEmailConfig() {
    const [configData, setConfigData] = useState<IPaymentEmailConfig>(paymentEmailProps.reduce((acc, name) => {
        acc[name] = '';
        return acc;
    }, {} as IPaymentEmailConfig));
    useEffect(() => {
        getPaymentEmailConfig().then(res => {            
            setConfigData(res)
        })
    }, [])
    return (<div className="bg-gradient-primary">
        <div className="container">

            <div className="row justify-content-center">
                <div className="col-lg-12">
                    <div className="p-5">
                        <div className="text-center">
                            <h1 className="h4 text-gray-900 mb-4">Email Config</h1>
                        </div>
                        <form className="user">
                            {
                                paymentEmailProps.map(name => {
                                    if (name === 'paymentEmailText') {
                                        return <div className="form-group">
                                            <textarea className="form-control "
                                                name="txtText" placeholder="body"
                                                rows={10}
                                                value={configData[name]}
                                                onChange={e => {
                                                    configData[name] = e.target.value;
                                                    setConfigData({
                                                        ...configData,
                                                    })
                                                }}
                                            />
                                    </div>
                                    }
                                    return <div className="form-group"> {getPaymentEmailDesc(name)}
                                        <input type="text" className="form-control form-control-user"
                                            name={name}
                                            placeholder={getPaymentEmailDesc(name)}
                                            value={configData[name]}
                                            onChange={e => {
                                                setConfigData({
                                                    ...configData,
                                                    [name]: e.target.value
                                                })
                                            }}
                                        />
                                    </div>
                                })
                            }                            
                            <a href="index.html" className="btn btn-primary btn-user btn-block"
                                onClick={(async e => {
                                    e.preventDefault();
                                    for (const name of paymentEmailProps) {
                                        await api.updateUserOptions(name, configData[name]);                                        
                                    }
                                })}
                            >Save
                            </a>
                        </form>
                        <div>
                            
                        </div>
                        <hr />
                    </div>
                </div>
                
            </div>                        
        </div>
        <div className="form-group bg-gray-100 text-gray-900">
            <div className="container">
                <div className="row">Usage:  { `Rent Payment of $LastPaymentAmount Was Received `}</div>
                <div className="row">{ ` Dear $Renters, <br>

Your Rent Payment of $LastPaymentAmount was received on $LastPaymentDate{MM/DD/YYYY}.
Here is your balance in details, 
<table>
<tr><td colspan=2>Balance Forwarded</td><td>$BalanceForwarded</td></tr>
<tr><td>Date</td><td>Transaction</td><td>Amount</td></tr>
$LoopMonthly{
<tr><td>$Date{MM/DD/YYYY}</td><td>$Type</td><td>$Amount</td></tr>
}
<tr><td colspan=2>Current Balance</td><td>$CurrentBalance</td></tr>
</table>

Please let me know if you have any questions or concerns. 
Thank you
**************************************************************************************************************************
This is an automatically generated email. Please do not reply, as this email address is not monitored.
If you have any questions or concerns, feel free to contact us by email at x y.
**************************************************************************************************************************`}</div>
            </div>
        </div>
        <div className="form-group">
        </div>            
    </div>)
}