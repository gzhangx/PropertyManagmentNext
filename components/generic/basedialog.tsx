import react, { Dispatch, SetStateAction, useState } from "react";

interface IGenericDialogProps {
    children:any;
    show: boolean;
}
export function BaseDialog(props: IGenericDialogProps) {
    const { children, show, } = props;
    const dspClassName = `modal ${show ? ' modal-show ' : 'modal'}`;
    return <div className={dspClassName} tabIndex={-1} role="dialog">
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
            <div className="modal-dialog">
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