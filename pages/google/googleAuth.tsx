import react, {useState, useEffect} from 'react';
import { useRouter } from 'next/router'
import * as api from '../../components/api';
import { getConfig, ISiteConfig } from '../../components/api'

import { GetInfoDialogHelper} from '../../components/generic/basedialog'
export default function GoogleAuth() {
    const router = useRouter();
    const infoDlg = GetInfoDialogHelper();

    const doneDlg = GetInfoDialogHelper();
    const [config, setConfig] = useState<ISiteConfig>({} as ISiteConfig);
    const getFullRurl = (rdurl: string) => `${rdurl}/google/googleAuth`;
    const code = router.query.code as string;
    useEffect(() => {
        getConfig().then(cfg => {
            console.log('got config ' + cfg.redirectUrl);
            console.log(cfg);
            setConfig(cfg);

            const redirectUrl = getFullRurl(cfg.redirectUrl);
            console.log(`sending code=${code} rurl=${redirectUrl}`);
            if (code) {
                infoDlg.setDialogText('Waiting creating google code');
                console.log(`creating auth, code=${code} redirUrl=${redirectUrl}`);
                api.createGoogleAuth(code, redirectUrl).then(tk => {
                    console.log(`sending code done for ${code}`);
                    console.log(`sending code done for ${code} ${tk.access_token}`);
                    infoDlg.setDialogText('');
                    doneDlg.setDialogText('got creating google code ' + tk.refresh_token);
                })
            }
        })
    }, [code]);
            
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${getFullRurl(config.redirectUrl)}&prompt=consent&response_type=code&client_id=${config.googleClientId}&scope=https://spreadsheets.google.com/feeds/&access_type=offline`;
    return (
        <>
            {
                infoDlg.getDialog()
            }
            {
                doneDlg.getDialog()
            }
            <div className="row">
                <div className="card shadow h-100 py-2 border-left-primary">
                    <div className="card-body">
                        <div className="row no-gutters align-items-center">
                            <div className="col mr-2">
                                <div className="text-xs font-weight-bold text-uppercase mb-1 text-primary">Auth With</div>
                                <div className="h5 mb-0 font-weight-bold text-gray-800">
                                <a href={url} className="btn btn-google btn-user btn-block">
                                    <i className="fab fa-google fa-fw"></i> Login with Google
                                </a>
                                </div>
                            </div>
                            <div className="col-auto">
                                <i className="fas fa-calendar fa-2x text-gray-300 fa-calendar"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>            
        </>)
}