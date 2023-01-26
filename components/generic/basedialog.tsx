import React from "react";
import react, { Dispatch, SetStateAction, useState } from "react";

interface IGenericDialogProps {
    children:any;
    show: boolean;
    raw?: boolean;
}
export function BaseDialog(props: IGenericDialogProps) {
    const { children, show, raw} = props;
    const dspClassName = `modal ${show ? ' modal-show ' : 'modal'}`;
    return raw?children:<div className={dspClassName} tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
                {children}
            </div>
        </div>
    </div>
}


interface IClosableDialogProps extends IGenericDialogProps {
    setShow: (s: boolean) => void;
    title?: string;
    footer?: string | JSX.Element | null;
}

export function CloseableDialog(props: IClosableDialogProps) {
    const onClose = () => {
        props.setShow(false);
    };
    const test = <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={onClose}>Close</button>
    return <BaseDialog {...props}>
        <>
            <div className="modal-dialog-scrollable">
                <div className="modal-content">
                    {
                        props.title && <div className="modal-header">
                            <h5 className="modal-title">{props.title}</h5>
                            <button type="button" className="close">
                                <span aria-hidden="true" onClick={onClose}>&times;</span>
                            </button>
                        </div>
                    }
                    {
                        props.children
                    }
                </div>
            </div>
            {
                props.footer ? props.footer : <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={onClose}>Close</button>
                </div>
            }
        </>
    </BaseDialog>
}


interface IInfoDialogProps  {
    hide: () => void;
    title?: string;
    message: string;
}

export function InforDialog(props: IInfoDialogProps) {
    return <div className='modal modal-show' tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{ props.title || ''}</h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <p>{ props.message }</p>
                    </div>
                    <div className="modal-footer">
                        <button className='btn btn-success' onClick={() => {
                            props.hide();
                        }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>;
}

interface IDialogState {
    text: string;
    onClose?: ()=>void;
}
export interface IDialogInfoHelper {
    setDialogText: (text: string) => void;
    setDialogAction: (text: string, onClose: () => void)=>void;
    dialogState: IDialogState;
    getDialog: () => JSX.Element;
}

export function GetInfoDialogHelper(): IDialogInfoHelper {
    const [dialogState, setDialogState] = useState<IDialogState>({
        text: '',
    });
    const setDialogText = (text: string) => setDialogState({ text });
    const infoHelper = {
        setDialogText,
        setDialogAction: (text, onClose) => setDialogState({
            text,
            onClose,
        }),
        dialogState,
        getDialog: function()  {
            const me = this as IDialogInfoHelper;
            return me.dialogState.text && <InforDialog message={me.dialogState.text} hide={() => {
                if (me.dialogState.onClose) me.dialogState.onClose();
                setDialogText('')
            }}></InforDialog>
        }
    }
    return infoHelper;
}