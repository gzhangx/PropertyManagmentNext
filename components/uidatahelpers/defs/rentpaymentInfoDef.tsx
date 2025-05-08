import { CloseableDialog } from "../../generic/basedialog";
import { IEditTextDropdownItem } from "../../generic/GenericDropdown";
import { ILeaseInfo, ITenantInfo } from "../../reportTypes";
import { gatherLeaseInfomation, HouseWithLease } from "../../utils/leaseUtil";
import { ICrudAddCustomObj, ITableAndSheetMappingInfo, ItemTypeDict } from "../datahelperTypes";
import * as api from '../../api'
import { formateEmail } from "../../utils/leaseEmailUtil";
import { orderBy } from "lodash";
import { customHeaderFilterFuncWithHouseIDLookup, genericCustomHeaderFilterFunc } from "./util";

const table = 'rentPaymentInfo';

export interface ICustEmailInfo {
    html: string;
    subject: string;
    to: string[];
    edit: boolean;
}
export const paymentInfoDef: ITableAndSheetMappingInfo<ICustEmailInfo> = {
    table,
    sheetMapping: {
        sheetName: 'PaymentRecord',
        range: 'A1:G',
        mapping: [
            'paymentID',
            'receivedDate',
            'receivedAmount',
            'houseID',
            'paymentTypeName',
            'paymentProcessor',
            'notes',
            //'paidBy',        
            //'created',
            //'modified',                
            //'month',                
            //'ownerID',
        ],
    },

    title: 'RentPaymentt Records',
    customAddNewDefaults: async (mainCtx, columnInfo, editItem) => {
        await mainCtx.loadForeignKeyLookup('leaseInfo');
        await mainCtx.loadForeignKeyLookup('tenantInfo');
        for (const c of columnInfo) {
            if (c.field === 'paymentTypeName') {
                editItem[c.field] = 'Rent';
            }
        }
    },
    customEditItemOnChange: async (mainCtx, fieldName: string, setCustomFieldMapping, editItem) => {
        const ret: ItemTypeDict = { [fieldName]: editItem[fieldName] };
        if (fieldName === 'houseID' || fieldName === 'leaseID') {
            if (editItem['leaseID'] && editItem['houseID']) {
                const oldpayments = orderBy(await api.getPaymnents({
                    whereArray: [
                        {
                            field: 'leaseID',
                            op: '=',
                            val: editItem['leaseID'],
                        },
                        {
                            field: 'houseID',
                            op: '=',
                            val: editItem['houseID'],
                        }
                    ]
                }), itm => itm.created, 'desc');            
                //console.log('debugRemove oldpayments-------------->', oldpayments[0]);
                const lastPayment = oldpayments[0];
                if (lastPayment) {
                    (ret as any).paidBy = lastPayment.paidBy;
                    (ret as any).paymentProcessor = lastPayment.paymentProcessor;
                    (ret as any).receivedAmount = lastPayment.receivedAmount;
                }
            }
            await mainCtx.loadForeignKeyLookup('leaseInfo');
            await mainCtx.loadForeignKeyLookup('tenantInfo');
            const fkObj = mainCtx.translateForeignLeuColumnToObject({
                field: 'leaseID',
                foreignKey: {
                    table: 'leaseInfo',
                    field: 'leaseID',
                }
            }, editItem);
            //console.log('fkObj', fkObj);
            if (fkObj) {
                const lease = fkObj as ILeaseInfo;
                if (lease.monthlyRent) {
                    ret['receivedAmount'] = lease.monthlyRent;
                    ret.leaseID = lease.leaseID;
                }
                const options: IEditTextDropdownItem[] = [];
                for (let ti = 1; ti <= 5; ti++) {
                    const tenantId = lease[`tenant${ti}`];
                    if (tenantId) {
                        const tenantTranslated = mainCtx.translateForeignLeuColumnToObject({
                            field: 'tenantID',
                            foreignKey: {
                                table: 'tenantInfo',
                                field: 'tenantID',
                            }
                        }, {
                            tenantID: tenantId,
                        }) as ITenantInfo;
                        if (tenantTranslated) {
                            //console.log('tenantTranslated', tenantTranslated);
                            options.push({
                                label: tenantTranslated.fullName,
                                value: tenantTranslated.fullName,
                            })
                            if (!ret['paidBy']) {
                                ret['paidBy'] = tenantTranslated.fullName;
                            }
                        }
                    }
                }
                setCustomFieldMapping(prev => {
                    return {
                        ...prev,
                        leaseToTenantCustOptions: {
                            ...prev.leaseToTenantCustOptions,
                            'paidBy': {
                                options,
                            }
                        }
                    }
                });

            }
        }
        return ret;

    },
    displayFields:
        [
            { field: 'receivedDate', 'desc': 'ReceivedDate', type: 'date', displayType: 'date' },
            { field: 'receivedAmount', 'desc': 'Amount', type: 'decimal', displayType: 'currency' },
            { field: 'houseID', 'desc': 'Address' },
            { field: 'paymentTypeName', 'desc': 'type', type: 'string' },
            { field: 'notes', 'desc': 'Notes', type: 'string' },
        ],
    sortFields: ['receivedDate', 'houseID'],
    orderColunmInfo(cols) {
        const orders = ['houseID', 'receivedDate', 'receivedAmount', 'paymentTypeName', 'notes'];

        const firsts = orders.map(o => cols.find(c => c.field === o)).filter(c => c);
        const lasts = cols.filter(c => !orders.includes(c.field));
        return firsts.concat(lasts);
    },
    customScreen: (cust: ICrudAddCustomObj<ICustEmailInfo>, setCustomFieldMapping: React.Dispatch<React.SetStateAction<ICrudAddCustomObj<ICustEmailInfo>>>) => {
        const emailPreviewDef = {
            html: 'testtest',
            subject: 'testsub',
            to: ['testot'],
            edit: false,
        };
        const emailPreview: {
            html: string;
            subject: string;
            to: string[];
            edit: boolean;
        } = cust.paymentUIRelated || emailPreviewDef;
        const closePreview = () => {
            setCustomFieldMapping(prev => {
                return {
                    ...prev,
                    paymentUIRelated_showRenterConfirmationScreen: false,
                    paymentUIRelated: {
                        ...(prev.paymentUIRelated || emailPreviewDef),                        
                    }
                }
            })
        };
        return cust.paymentUIRelated_showRenterConfirmationScreen && <CloseableDialog show={!!emailPreview.html}
            rootDialogStyle={{
                maxWidth: '1000px'
            }}
            setShow={closePreview}
            footer={<div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                    await api.sendEmail(emailPreview.to, emailPreview.subject, emailPreview.html);
                }}>Send</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                    setCustomFieldMapping(prev => {
                        return {
                            ...prev,
                            paymentUIRelated: {
                                ...(prev.paymentUIRelated || emailPreviewDef),
                                edit: !(cust.paymentUIRelated)?.edit,
                            }
                        }
                    })
                }}>{emailPreview.edit ? 'Stop Edit' : 'Edit'}</button>
                <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={closePreview}>Close</button>
            </div>}
        >
            <div style={{ overflow: 'scroll' }}>
                <div className="container-fluid">
                    <div className="row">
                        <div className="card bg-primary text-white shadow">
                            <div className="card-body">                                
                                <input type='text'
                                    className="form-control "
                                    placeholder='Email To'
                                    size={(emailPreview.to.join(',').length)}
                                    value={emailPreview.to.join(',')} onChange={e => {
                                        setCustomFieldMapping(prev => {
                                            return {
                                                ...prev,
                                                paymentUIRelated: {
                                                    ...(prev.paymentUIRelated || emailPreviewDef),
                                                    to: [e.target.value],
                                                }
                                            }
                                        })
                                    }}></input>
                                <div className="text-white-50 small">to</div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="card bg-success text-white shadow">
                            <div className="card-body">
                                {emailPreview.edit ? <input type='text'
                                    className="form-control "
                                    placeholder='Subject'
                                    size={emailPreview.subject.length}
                                    value={emailPreview.subject} onChange={e => {
                                        setCustomFieldMapping(prev => {
                                            return {
                                                ...prev,
                                                paymentUIRelated: {
                                                    ...(prev.paymentUIRelated || emailPreviewDef),
                                                    subject: e.target.value,
                                                }
                                            }
                                        })
                                    }}></input> : emailPreview.subject}
                                <div className="text-white-50 small">subject</div>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="card bg-info text-white shadow">
                            {emailPreview.edit ? <textarea rows={10} cols={100}
                                value={emailPreview.html}
                                onChange={e => {
                                    setCustomFieldMapping(prev => {
                                        return {
                                            ...prev,
                                            paymentUIRelated: {
                                                ...(prev.paymentUIRelated || emailPreviewDef),
                                                html: e.target.value,
                                            }
                                        }
                                    })
                                }}
                            />
                                : <div dangerouslySetInnerHTML={{ __html: emailPreview.html }}></div>}

                        </div>
                    </div>
                </div>
            </div>
        </CloseableDialog>
    },
    customFooterButton(mainCtx, cust, setCustomFieldMapping, item) {
        const customFooterFunc = async () => {
            const houseID = item.houseID as string;
            if (!houseID) return;
            const house: HouseWithLease = {
                houseID,
            } as HouseWithLease;
            const leaseInfo = await gatherLeaseInfomation(house);
            const formatedData = await formateEmail(mainCtx, house, err => {
                mainCtx.topBarErrorsCfg.setTopBarItems(itm => {
                    return [...itm, {
                        text: err,
                    }]
                })
            });       
            setCustomFieldMapping(prev => {
                return {
                    ...prev,
                    paymentUIRelated_showRenterConfirmationScreen: true,
                    paymentUIRelated: {
                        html: formatedData.body,
                        subject: formatedData.subject,
                        to: formatedData.mailtos,
                        edit: false,                        
                    }
                }
            })
        };
        const customFooterUI = <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={async e => {
            e.preventDefault();
            await customFooterFunc();
        }}>Email</button>
        return {
            customFooterFunc,
            customFooterUI,
        }
    },
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return customHeaderFilterFuncWithHouseIDLookup(mainCtx, pageState, colInfo, table);
    },
};