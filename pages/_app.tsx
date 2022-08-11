import '../styles/global.css'
import '../styles/sb-admin-2.css'
//import '../public/fontawesome-free/css/all.css'
import { useRouter } from 'next/router';

import * as RootState from '../components/states/RootState'
import { PaymentExpenseStateWrapper} from '../components/states/PaymentExpenseState'

export default function App({ Component, pageProps }) {
    //static page hack https://www.alpeaudio.com/post/hosting-a-next-js-app-with-routing-on-aws-s3/
    const router = useRouter();
    const path = (/#!(\/.*)$/.exec(router.asPath) || [])[1];
    if (path) {
        router.replace(path);
    }

    return <RootState.RootPageStateWrapper>
        <PaymentExpenseStateWrapper>
            <Component {...pageProps} />
        </PaymentExpenseStateWrapper>
    </RootState.RootPageStateWrapper>    
}
