import { useEffect, useState } from "react";
import * as api from '../../api'

const paymentEmailSubject = 'paymentEmailSubject';
const paymentEmailText = 'paymentEmailText';

export function RenterEmailConfig() {
    const [configData, setConfigData] = useState({
        subject: '',
        text: '',
    });
    useEffect(() => {
        api.getUserOptions([]).then(res => {
            const subject = res.find(r => r.id === paymentEmailSubject)?.data || '';
            const text = res.find(r => r.id === paymentEmailText)?.data || '';
            setConfigData({
                subject,
                text,
            })
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
                            <a href="index.html" className="btn btn-primary btn-user btn-block"
                                onClick={(async e => {
                                    e.preventDefault();
                                    await api.updateUserOptions(paymentEmailSubject, configData.subject);
                                    await api.updateUserOptions(paymentEmailText, configData.text);
                                })}
                            >Save
                            </a>
                        </form>
                        <hr />
                    </div>
                </div>
                
            </div>

        </div>
    </div>)
}