import react, {useState, useEffect} from 'react';
import { useRouter } from 'next/router'
import * as api from '../../components/api';
import { Dialog, IDialogInfo, createDialogPrms } from '../../components/dialog';
import Link from 'next/link';
import { getConfig, ISiteConfig } from '../../components/api'

export default function GoogleAuth() {
    const router = useRouter();    
    const dlgPrm = createDialogPrms();
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
                dlgPrm.setDialogInfo({
                    show: true,
                    title: 'Waiting',
                    body: 'Waiting creating google code',
                });                
                console.log(`creating auth, code=${code} redirUrl=${redirectUrl}`);                
                api.createGoogleAuth(code, redirectUrl).then(tk => {
                    console.log(`sending code done for ${code}`);
                    console.log(`sending code done for ${code} ${tk.access_token}`);
                    dlgPrm.setDialogInfo({
                        show: true,
                        title: 'got it',
                        body: 'got creating google code ' + tk.refresh_token,
                    });
                })
            }
        })
    },[code]);
            
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${getFullRurl(config.redirectUrl)}&prompt=consent&response_type=code&client_id=${config.googleClientId}&scope=https://spreadsheets.google.com/feeds/&access_type=offline`;
    return (
        <a href={url} className="btn btn-google btn-user btn-block">
            <i className="fab fa-google fa-fw"></i> Login with Google
        </a>)                                           
}