
import '../styles/sb-admin-2.css'
import '../styles/gg-editable-dropdown.css'
import '../styles/tags-input.css'
import '../styles/global.css'
//import '../public/fontawesome-free/css/all.css'

import * as RootState from '../components/states/RootState'
import { PageRelatedContextWrapper } from '../components/states/PageRelatedState'
//import { PaymentExpenseStateWrapper} from '../components/states/PaymentExpenseState'

//<!-- PaymentExpenseStateWrapper -->
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
    return <RootState.RootPageStateWrapper>
        <PageRelatedContextWrapper>            
                <Component {...pageProps} />            
        </PageRelatedContextWrapper>
    </RootState.RootPageStateWrapper>
}
