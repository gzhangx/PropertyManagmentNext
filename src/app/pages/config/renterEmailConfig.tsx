import { useEffect, useState } from "react";
import * as api from '../../../components/api'
import { getPaymentEmailConfig, getPaymentEmailDesc, googleSmtpPass, googleSmtpUser, IPaymentEmailConfig, paymentEmailProps, paymentEmailSubject, paymentEmailText } from "../../../components/utils/leaseEmailUtil";
import { TextFieldOutlined } from "../../../components/uidatahelpers/wrappers/muwrappers";


import { createTheme, ThemeProvider } from '@mui/material/styles';
const darkTheme = createTheme({
    components: {
        MuiContainer: {
            defaultProps: {
                disableGutters: true, // Removes default padding
            },
        },
      },
    palette: {
        mode: 'dark', // Force dark mode for this page
    },
});
export function RenterEmailConfig() {
    return <ThemeProvider theme={darkTheme}>
        <RenterEmailConfigUnthemed></RenterEmailConfigUnthemed>
    </ThemeProvider>
}
export function RenterEmailConfigUnthemed() {
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

            <div className="row justify-content-center ">
                <div className="col-lg-12  ">
                    <div className="p-5 gg-modal-dialog-scrollable">
                        <div className="text-center">
                            <h1 className="h4 text-gray-900 mb-4">Email Config</h1>
                        </div>
                        <form className="user">
                            {
                                paymentEmailProps.map((name, key) => {
                                    if (name === 'paymentEmailText') {
                                        return <div className="form-group" key={key}>
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
                                    return <div className="form-group" key={key}>
                                        <TextFieldOutlined label={getPaymentEmailDesc(name)} value={configData[name]}                                            
                                            style={{ width: '100%' }}
                                            onChange={e => {
                                                setConfigData({
                                                    ...configData,
                                                    [name]: e.target.value
                                                })
                                            }}
                                        ></TextFieldOutlined>                                        
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