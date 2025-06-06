import react, {useState} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import * as api from '../../components/api';
import Link from 'next/link';
import { GetInfoDialogHelper } from '../../components/generic/basedialog';
import { navgateToWithState, useRootPageContext } from '@/src/components/states/RootState';

export default function ForgetPassword() {
    const router = useRouter();
    const infoDlg = GetInfoDialogHelper();
    const rState = useRootPageContext();
    
    const [state, setState] = useState({
        email: '',
    });
    const [dialogInfo, setDialogInfo] = useState({
        show: false
    });
    const submit = (e:any) => {
        e.preventDefault();
        if (!api.emailRegx.test(state.email)) {
            return infoDlg.setDialogText('Invalid email format '+state.email);
        }
        api.resetPassword({ username: state.email }).then(() => {
            showDialog('You should receive email with your password shortly',
                'Reset', () => {
                    router.push('/Login'); 
            }); 
        });
    };
    const showDialog = (msg: string, title='Info', onClose: ()=>void) => {
        infoDlg.setDialogAction(msg, onClose)
    }
    return <div className="container">
        {
            infoDlg.getDialog()
        }
    <div className="row justify-content-center">

        <div className="col-xl-10 col-lg-12 col-md-9">

            <div className="card o-hidden border-0 shadow-lg my-5">
                <div className="card-body p-0">
                    <div className="row">
                        <div className="col-lg-6 d-none d-lg-block bg-password-image"></div>
                        <div className="col-lg-6">
                            <div className="p-5">
                                <div className="text-center">
                                    <h1 className="h4 text-gray-900 mb-2">Forgot Your Password?</h1>
                                    <p className="mb-4">We get it, stuff happens. Just enter your email address below
                                        and we'll send you a link to reset your password!</p>
                                </div>
                                <form className="user">
                                    <div className="form-group">
                                        <input type="email" className="form-control form-control-user"
                                            id="exampleInputEmail" aria-describedby="emailHelp"
                                                placeholder="Enter Email Address..."
                                                value={state.email}
                                                onChange={e => {
                                                    setState({
                                                        email: e.target.value
                                                    })
                                                }}
                                            />
                                    </div>
                                        <a href="login.html" className="btn btn-primary btn-user btn-block"
                                        onClick={submit}>
                                        Reset Password
                                    </a>
                                </form>
                                <hr/>
                                    <div className="text-center">
                                    <Link href="register" legacyBehavior>
                                            <a className="small" href="#" onClick={e => {
                                                navgateToWithState(rState, 'register', e);
                                            }}>Create an Account!</a>
                                        </Link>
                                </div>
                                    <div className="text-center">
                                    
                                        <a className="small" href="#" onClick={e => {
                                            navgateToWithState(rState, 'login', e);
                                        }}>Already have an account? Login!</a>                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

    </div>

</div>

}