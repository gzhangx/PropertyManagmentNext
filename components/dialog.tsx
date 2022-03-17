import react, { Dispatch, SetStateAction, useState } from "react";

import { CloseableDialog } from './generic/basedialog'
export interface IDialogInfo {
    show: boolean;
    title: string;
    body: string;
}

export interface IDialogInfoPrm {
    dialogInfo: IDialogInfo;
    setDialogInfo: Dispatch<SetStateAction<IDialogInfo>>;
}

export interface IDialogProps {
    dialogInfo: IDialogInfoPrm;
    children?: any;
}

export function createDialogPrms(): IDialogInfoPrm{
    const [dialogInfo, setDialogInfo] = useState<IDialogInfo>({
        show: false,
        title: '', body: '',
    });
    return {
        dialogInfo,
        setDialogInfo,
    }
}

export function Dialog(props: IDialogProps) {    
    const { dialogInfo, children } = props;
    const { title, body } = dialogInfo.dialogInfo;
    const dspClassName = `modal ${dialogInfo.dialogInfo.show ? ' modal-show ' : 'modal'}`;    
    return <CloseableDialog show={dialogInfo.dialogInfo.show} 
        setShow={
            show => dialogInfo.setDialogInfo({
                ...dialogInfo.dialogInfo,
                show,
            })
        }
        title={title}
    >
        {children}
        {
            body && <div className="modal-body">
                <p>{body}</p>
            </div>
        }
    </CloseableDialog>
}