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
          
    </div>)
}