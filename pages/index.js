import { useState } from 'react'
import CRoute from './[route]'
import Login from './Login'

import { useRouter } from 'next/router';
import { NAVPrefix } from '../components/nav/consts';
export default function Home1() {

    //static page hack https://www.alpeaudio.com/post/hosting-a-next-js-app-with-routing-on-aws-s3/    
    return <CRoute/>
    const [mainState, setMainState] = useState({
        userInfo: {
            username: null,
            password: null,
            isLoggedIn: false,
        }
    });
    //if (mainState.userInfo.isLoggedIn)
    //    return <Home state={mainState} setMainState={setMainState}></Home>
    //else 
    return <Login state={mainState} setMainState={setMainState}></Login>
}