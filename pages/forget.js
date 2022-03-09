import react, {useState} from 'react';
import { useRouter } from 'next/router'
import * as api from '../components/api';
import { Dialog } from '../components/dialog';
import Link from 'next/link';
export default function ForgetPassword() {
    const router = useRouter();
    const commingSoon = e => {
        e.preventDefault();
        setDialogInfo({
            show: true,
            title: 'Not implemented',
            body: 'Comming Soon'
        })
    }
    const [state, setState] = useState({
        email: '',
    });
    const [dialogInfo, setDialogInfo] = useState({
        show: false
    });
    const submit = e => {
        e.preventDefault();
        if (!api.emailRegx.test(state.email)) {
            return showDialog('Invalid email format '+state.email);
        }
        api.resetPassword({ username: state.email }).then(() => {
            showDialog('You should receive email with your password shortly',
                'Reset', () => {
                    router.push('/Login'); 
            }); 
        });
    };
    const showDialog = (msg, title='Info', onClose) => {
        setDialogInfo({
            show: true,
            title,
            body: msg,
            onClose,
        })
    }
    return <div className="container">
        <Dialog dialogInfo={dialogInfo} setDialogInfo={setDialogInfo} ></Dialog>
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
                                    <Link href="register">
                                            <a className="small" href="#">Create an Account!</a>
                                        </Link>
                                </div>
                                    <div className="text-center">
                                    <Link href="Login">
                                            <a className="small" href="#">Already have an account? Login!</a>
                                    </Link>
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