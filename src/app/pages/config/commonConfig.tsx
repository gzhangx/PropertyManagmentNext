import { useEffect, useState } from "react";
import * as api from '../../../components/api'
import { TextFieldOutlined } from "../../../components/uidatahelpers/wrappers/muwrappers";
import { startCase } from "lodash";



export const commonConfigProps = [
    'CitiUrl',
    'CitiPass',
] as const;

type CommonConfigPropType = typeof commonConfigProps[number];

export function getCommonConfigDesc(name: CommonConfigPropType) {
    return startCase(name);
}

export type ICommonConfig = Record<CommonConfigPropType, string>;
export async function getCommonConfig(): Promise<ICommonConfig> {
    return api.getUserOptions([]).then(res => {
        const retObj: ICommonConfig = {} as ICommonConfig;
        commonConfigProps.forEach(name => {
            retObj[name] = res.find(r => r.id === name)?.data || '';
        })        
        return retObj;
    })
}

export function CommonConfig() {
    return <CommonConfigUnthemed></CommonConfigUnthemed>
    
}
export function CommonConfigUnthemed() {
    const [configData, setConfigData] = useState<ICommonConfig>(commonConfigProps.reduce((acc, name) => {
        acc[name] = '';
        return acc;
    }, {} as ICommonConfig));
    useEffect(() => {
        getCommonConfig().then(res => {            
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
                                commonConfigProps.map((name, key) => {                                    
                                    return <div className="form-group" key={key}>
                                        <TextFieldOutlined label={getCommonConfigDesc(name)} value={configData[name]}                                            
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
                                    for (const name of commonConfigProps) {
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