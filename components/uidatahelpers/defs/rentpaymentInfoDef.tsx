import { CloseableDialog } from "../../generic/basedialog";
import { IEditTextDropdownItem } from "../../generic/GenericDropdown";
import { IHouseInfo, ILeaseInfo, ITenantInfo } from "../../reportTypes";
import { gatherLeaseInfomation, HouseWithLease } from "../../utils/leaseUtil";
import { ICrudAddCustomObj, ITableAndSheetMappingInfo, ItemType, ItemTypeDict } from "../datahelperTypes";
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

    title: 'Rent Payments Records',
    customAddNewDefaults: async (mainCtx, columnInfo, editItem) => {
        await mainCtx.loadForeignKeyLookup('leaseInfo');
        await mainCtx.loadForeignKeyLookup('tenantInfo');
        for (const c of columnInfo) {
            if (c.field === 'paymentTypeName') {
                editItem.data[c.field] = 'Rent';
            }
        }
    },
    customEditItemOnChange: async (mainCtx, fieldName: string, setCustomFieldMapping, editItem, isNew) => {
        if (!isNew) return editItem;
        const ret: ItemType = {
            data: { [fieldName]: editItem.data[fieldName] }
        };
        if (fieldName === 'houseID' && !editItem.data['leaseID']) {
            //auto populate latest lease
            const leaseInfo = await gatherLeaseInfomation({houseID: editItem.data['houseID']} as IHouseInfo);
            if (leaseInfo) {
                if (typeof leaseInfo === 'string') {
                    console.log('Warning error load leas from customEditItemOnChange')
                } else {
                editItem.data['leaseID'] = leaseInfo.lease.leaseID;
                }
            }
        }
        if (fieldName === 'houseID' || fieldName === 'leaseID') {
            if (editItem.data.leaseID && editItem.data.houseID) {
                const oldpayments = orderBy(await api.getPaymnents({
                    whereArray: [
                        {
                            field: 'leaseID',
                            op: '=',
                            val: editItem.data.leaseID,
                        },
                        {
                            field: 'houseID',
                            op: '=',
                            val: editItem.data.houseID,
                        }
                    ]
                }), itm => itm.created, 'desc');            
                //console.log('debugRemove oldpayments-------------->', oldpayments[0]);
                const lastPayment = oldpayments[0];
                if (lastPayment) {
                    (ret.data as any).paidBy = lastPayment.paidBy;
                    (ret.data as any).paymentProcessor = lastPayment.paymentProcessor;
                    (ret.data as any).receivedAmount = lastPayment.receivedAmount;
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
                const lease = (fkObj as ItemType).data  as ILeaseInfo;
                if (lease) {
                if (lease.monthlyRent) {
                    ret.data['receivedAmount'] = lease.monthlyRent;
                    ret.data.leaseID = lease.leaseID;
                }
                const options: IEditTextDropdownItem[] = [];
                for (let ti = 1; ti <= 5; ti++) {
                    const tenantId = lease[`tenant${ti}`];
                    if (tenantId) {
                        const tenantTranslated = (mainCtx.translateForeignLeuColumnToObject({
                            field: 'tenantID',
                            foreignKey: {
                                table: 'tenantInfo',
                                field: 'tenantID',
                            }
                        }, {
                            data:{ 
                            tenantID: tenantId,
                            }
                        }) as ItemType).data as ITenantInfo;
                        if (tenantTranslated) {
                            //console.log('tenantTranslated', tenantTranslated);
                            options.push({
                                label: tenantTranslated.fullName,
                                value: tenantTranslated.fullName,
                            })
                            if (!ret.data['paidBy']) {
                                ret.data['paidBy'] = tenantTranslated.fullName;
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
        }
        return ret;

    },
    displayFields:
        [
            { field: 'receivedDate', 'desc': 'Received Date', type: 'date', displayType: 'date' },
            { field: 'receivedAmount', 'desc': 'Amount', type: 'decimal', displayType: 'currency' },
            { field: 'houseID', 'desc': 'House' },
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
            <table className="table-NOborder">
                <tr >
                    <td className="td20PercentWidth">Email To:</td>
                    <td className="td80PercentWidth">
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

                    </td>
                </tr>
                <tr>
                    <td className="td20PercentWidth">Email Subject:</td>
                    <td className=" td80PercentWidth">
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
                    </td>

                </tr>
                <tr>
                    <td colSpan={2} className="">

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

                    </td>
                </tr>

            </table>
        </CloseableDialog>
    },
    customFooterButton(mainCtx, cust, setCustomFieldMapping, item) {
        const customFooterFunc = async () => {
            const houseID = item.data.houseID as string;
            if (!houseID) return;
            const house: HouseWithLease = {
                houseID,
            } as HouseWithLease;
            
            const formatedData = await formateEmail(mainCtx, house, err => {
                mainCtx.topBarErrorsCfg.setTopBarItems(itm => {
                    return [...itm, {
                        text: err,
                    }]
                })
            });
            console.log('format email res',house,formatedData)
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