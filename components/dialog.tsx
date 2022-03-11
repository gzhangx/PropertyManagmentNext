import react, { Dispatch, SetStateAction, useState } from "react";

export interface IDialogInfo {
    show: boolean;
    title: string;
    body: string;
    raw?: boolean; //set to raw for raw body.
    onClose?: () => void;
}

export interface IDialogInfoPrm {
    dialogInfo: IDialogInfo;
    setDialogInfo: Dispatch<SetStateAction<IDialogInfo>>;
    onClose: () => void;
}

export interface IDialogProps {
    dialogInfo: IDialogInfoPrm;
    onClose?: () => void;
    children?: any;
}

export function createDialogPrms(raw?: boolean): IDialogInfoPrm{
    const [dialogInfo, setDialogInfo] = useState<IDialogInfo>({
        show: false,
        title: '', body: '',
        raw,
    });
    return {
        dialogInfo,
        setDialogInfo,
        onClose: () => { },
    }
}

export function Dialog(props: IDialogProps) {    
    const { dialogInfo, children } = props;
    const { title, body } = dialogInfo.dialogInfo;
    const onClose = () => {
        dialogInfo.setDialogInfo({
            show: false,
            title: '',
            body:'',
        });
        if (props.onClose) props.onClose();
        if (dialogInfo.onClose) dialogInfo.onClose();
    };
    const dspClassName = `modal ${dialogInfo.dialogInfo.show ? ' modal-show ' : 'modal'}`;
    if (dialogInfo.dialogInfo.raw)
        return <div className={dspClassName} tabIndex={-1} role="dialog">
            {children}
        </div>
    return <div className={dspClassName} tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">{ title }</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true" onClick={onClose}>&times;</span>
                    </button>
                </div>
                {
                    children 
                }   
                {
                    !children && <><div className="modal-body">
                        <p>{body}</p>
                    </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={onClose}>Close</button>
                        </div>
                    </>
                }
            </div>
        </div>
    </div>;
}