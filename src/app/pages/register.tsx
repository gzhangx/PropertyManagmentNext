import react, {useState} from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { GetInfoDialogHelper } from '../../components/generic/basedialog';
import { registerUser } from '../../components/api'
const emailRegx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
export default function register() {
    const router = useRouter();    

    const infoDlg = GetInfoDialogHelper();
    const [state, setMainState] = useState({
        username: '',        
        firstName: '',
        lastName: '',
    });
    const setVal = (name: string, e: any) => {
        setMainState({
            ...state,
            [name]: e.target.value,
        })
    }

    const getSetValFunc = (name: string) => {
        return (e:any) => setVal(name, e);
    }

    const register = () => {
        if (!state.username) {
            return infoDlg.setDialogText('No username')
        }
        if (!emailRegx.test(state.username)) {
            return infoDlg.setDialogText('username must be email address');
        }
        registerUser(state).then((res: any) => {
            if (res.error) {
                return infoDlg.setDialogText('Register error ' + res.error);
            }

            infoDlg.setDialogAction('You should receive email with your password shortly', () => {
                router.push('/Login');
            })
        })
    }

    const commingSoon = (e:any) => {
        e.preventDefault();
        infoDlg.setDialogText('Not implemented')        
    }

    return <div className="container">
        {
            infoDlg.getDialog()
        }
        <div className="card o-hidden border-0 shadow-lg my-5">
            <div className="card-body p-0">
                <div className="row">
                    <div className="col-lg-5 d-none d-lg-block bg-register-image"></div>
                    <div className="col-lg-7">
                        <div className="p-5">
                            <div className="text-center">
                                <h1 className="h4 text-gray-900 mb-4">Create an Account!</h1>
                            </div>
                            <form className="user">
                                <div className="form-group row">
                                    <div className="col-sm-6 mb-3 mb-sm-0">
                                        <input type="text" className="form-control form-control-user" id="firstName"
                                            placeholder="First Name"
                                            value={state.firstName}
                                            onChange={getSetValFunc('firstName')}
                                        />
                                    </div>
                                    <div className="col-sm-6">
                                        <input type="text" className="form-control form-control-user" id="lastName"
                                            placeholder="Last Name"
                                            value={state.lastName}
                                            onChange={getSetValFunc('lastName')}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <input type="email" className="form-control form-control-user" id="email"
                                        placeholder="Email Address"
                                        value={state.username}
                                        onChange={getSetValFunc('username')}
                                    />
                                </div>                                
                                <a href="login.html" className="btn btn-primary btn-user btn-block"
                                    onClick={e => {
                                        e.preventDefault();
                                        register();
                                    }}
                                >
                                    Register Account
                                </a>
                                <hr />
                                <a href="index.html" className="btn btn-google btn-user btn-block"
                                onClick={commingSoon}>
                                    <i className="fab fa-google fa-fw"></i> Register with Google
                                </a>
                                <a href="index.html" className="btn btn-facebook btn-user btn-block"
                                    onClick={commingSoon}
                                >
                                    <i className="fab fa-facebook-f fa-fw"></i> Register with Facebook
                                </a>
                            </form>
                            <hr />
                            <div className="text-center">
                                <Link href="/forget" legacyBehavior>
                                    <a className="small" href="forgot-password.html">Forgot Password?</a>
                                    </Link>
                            </div>
                            <div className="text-center">
                                <Link href="/Login" legacyBehavior>
                                    <a className="small" href="#">Already have an account? Login!</a>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
}