import '../styles/global.css'
import '../styles/sb-admin-2.css'
//import '../public/fontawesome-free/css/all.css'

import * as RootState from '../components/states/RootState'

export default function App({ Component, pageProps }) {    
    return <RootState.RootPageStateWrapper>
        <Component {...pageProps} />
    </RootState.RootPageStateWrapper>    
}
