import { useEffect, useState } from "react";
import * as api from '../../api'
import { getPaymentEmailConfig, googleSmtpPass, googleSmtpUser, paymentEmailSubject, paymentEmailText } from "../../utils/leaseEmailUtil";



export function RenterEmailConfig() {
    const [configData, setConfigData] = useState({
        subject: '',
        text: '',

        user: '',
        pass: '',
    });
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
                            <div className="form-group">
                                <input type="text" className="form-control form-control-user"
                                    name="txtSubject"
                                    placeholder="subject"
                                    value={configData.subject}
                                    onChange={e => {
                                        setConfigData({
                                            ...configData,
                                            subject: e.target.value
                                        })
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <textarea className="form-control "
                                    name="txtText" placeholder="body"
                                    rows={10}
                                    value={configData.text}
                                    onChange={e => {
                                        configData.text = e.target.value;
                                        setConfigData({
                                            ...configData,
                                        })
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <input type='text' className="form-control "
                                    name="txtUser" placeholder="User"
                                    value={configData.user}
                                    onChange={e => {
                                        configData.user = e.target.value;
                                        setConfigData({
                                            ...configData,
                                        })
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <input type='text' className="form-control "
                                    name="txtPass" placeholder="Pass"
                                    value={configData.pass}
                                    onChange={e => {
                                        configData.pass = e.target.value;
                                        setConfigData({
                                            ...configData,
                                        })
                                    }}
                                />
                            </div>
                            <a href="index.html" className="btn btn-primary btn-user btn-block"
                                onClick={(async e => {
                                    e.preventDefault();
                                    await api.updateUserOptions(paymentEmailSubject, configData.subject);
                                    await api.updateUserOptions(paymentEmailText, configData.text);
                                    await api.updateUserOptions(googleSmtpUser, configData.user);
                                    await api.updateUserOptions(googleSmtpPass, configData.pass);
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
<tr><td>Date</td><td>Previous Balance</td><td>Paid</td><td>Balance</td></tr>
$LoopMonthly{3, <tr><td>$PaymentDate{YYYY/MMM}</td> <td>balance=$PreviousBalance</td> <td>p=$Paid</td> <td>balance=$Balance</td></tr>
}
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