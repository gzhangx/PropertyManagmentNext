import { useEffect, useState } from 'react'
import CRoute from './[route]'
import Login from './Login'

import * as RootState from '../components/states/RootState'
export default function Home1() {
    const [mainState, setMainState] = useState({
        userInfo: {
            username: null,
            password: null,
            isLoggedIn: false,
        }
    });

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const rs = RootState.useRootPageContext();
    useEffect(() => {
        setIsLoggedIn(!!rs?.userInfo?.id);
    }, [rs?.userInfo?.id]);
    if (isLoggedIn) {
        console.log('has login', rs.userInfo)
        //static page hack https://www.alpeaudio.com/post/hosting-a-next-js-app-with-routing-on-aws-s3/    
        return <CRoute />
    }
    //if (mainState.userInfo.isLoggedIn)
    //    return <Home state={mainState} setMainState={setMainState}></Home>
    //else 
    return <Login state={mainState} setMainState={setMainState}></Login>
}