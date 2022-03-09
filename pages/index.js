import { useState } from 'react'
import Home from './dashboard'
import Login from './Login'
export default function Home1() {

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