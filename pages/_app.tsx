import '../styles/global.css'
import '../styles/sb-admin-2.css'
//import '../public/fontawesome-free/css/all.css'

import * as RootState from '../components/states/RootState'
import { PaymentExpenseStateWrapper} from '../components/states/PaymentExpenseState'

export default function App({ Component, pageProps }) {    
    return <RootState.RootPageStateWrapper>
        <PaymentExpenseStateWrapper>
            <Component {...pageProps} />
        </PaymentExpenseStateWrapper>
    </RootState.RootPageStateWrapper>    
}
