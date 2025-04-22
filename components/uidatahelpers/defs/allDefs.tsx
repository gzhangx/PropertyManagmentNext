import moment from "moment";
import { TableNames } from "../../types";
import { ICrudAddCustomObj, ITableAndSheetMappingInfo, ItemTypeDict } from "../datahelperTypes";
import { ILeaseInfo, ITenantInfo } from "../../reportTypes";
import { IEditTextDropdownItem } from "../../generic/GenericDropdown";
import { orderBy } from "lodash";
import { CloseableDialog } from "../../generic/basedialog";
import * as api from '../../api'
import { gatherLeaseInfomation, getLeaseUtilForHouse, HouseWithLease } from "../../utils/leaseUtil";
import { formateEmail } from "../../utils/leaseEmailUtil";

export const workerInfoDef: ITableAndSheetMappingInfo = {
    table: 'workerInfo',
    sheetMapping: {
        sheetName: 'Workers Info',
        range: 'A1:K',
        mapping: [
            'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip',
            '', //contact
            'email',
            'phone',
        ]
    }
}

export const paymentInfoDef: ITableAndSheetMappingInfo = {
    table: 'rentPaymentInfo',
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
    //this class is defined by components/page/inputs/rentpaymentInfo.tsx
    customDisplayFunc: (value, fieldDef) => {
        if(fieldDef.field === 'receivedDate') {
            let str = moment(value).format('YYYY-MM-DD HH:mm:ss'); 
            while (str.endsWith(':00')) {
                str = str.substring(0, str.length - 3);
            }
            if (str.endsWith(' 00')) {
                str = str.substring(0, str.length - 3);
            }
            return str;
        }
        return value;
    },
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
            await mainCtx.loadForeignKeyLookup('leaseInfo');
            await mainCtx.loadForeignKeyLookup('tenantInfo');
            const fkObj = mainCtx.translateForeignLeuColumnToObject({
                field: 'leaseID',
                foreignKey: {
                    table: 'leaseInfo',
                    field: 'leaseID',
                }
            }, editItem);
            console.log('fkObj', fkObj);
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
                            console.log('tenantTranslated', tenantTranslated);
                            options.push({
                                label: tenantTranslated.fullName,
                                value: tenantTranslated.fullName,
                            })
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
        { field: 'receivedDate', 'desc': 'ReceivedDate', type: 'date' },
        { field: 'receivedAmount', 'desc': 'Amount', type: 'decimal' },
        { field: 'houseID', 'desc': 'Address' },
        { field: 'paymentTypeName', 'desc': 'type' },
        { field: 'notes', 'desc': 'Notes' },
        ],
    sortFields: ['receivedDate', 'houseID'],
    orderColunmInfo(cols) {
        const orders = ['houseID', 'receivedDate', 'receivedAmount', 'paymentTypeName','notes'];
        
        const firsts = orders.map(o => cols.find(c => c.field === o)).filter(c => c);
        const lasts = cols.filter(c => !orders.includes(c.field));
        return firsts.concat(lasts);
    },
    customScreen: (cust: ICrudAddCustomObj, setCustomFieldMapping: React.Dispatch<React.SetStateAction<ICrudAddCustomObj>>) => {
        const emailPreviewDef = {
            html: 'testtest',
            subject: 'testsub',
            to: 'testot',
            edit: false,
        };
        const emailPreview: any = cust.paymentUIRelated || emailPreviewDef;
        const closePreview = () => {
            setCustomFieldMapping(prev => {
                return {
                    ...prev,
                    paymentUIRelated: {
                        ...(prev.paymentUIRelated || emailPreviewDef),
                        showRenterConfirmationScreen: false,
                    }
              }
          })
        };
        return cust.paymentUIRelated?.showRenterConfirmationScreen && <CloseableDialog show={!!emailPreview.html}
                    rootDialogStyle={{
                        maxWidth: '1000px'
                    }}
                    setShow={closePreview}
                    footer={<div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                            await api.sendEmail(emailPreview.to.split(','), emailPreview.subject, emailPreview.html);
                        }}>Send</button>
                        <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={async () => {
                            setCustomFieldMapping(prev => {
                                return {
                                    ...prev,
                                    paymentUIRelated: {
                                        ...(prev.paymentUIRelated || emailPreviewDef),
                                        edit: (cust.paymentUIRelated as any)?.edit,
                                    }
                                }
                            })
                        }}>{ emailPreview.edit? 'Stop Edit': 'Edit'}</button>
                        <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={closePreview}>Close</button>
                    </div>}
                >
                    <div style={{overflow:'scroll'}}>
                        <div className="container-fluid">
                                <div className="row">
                                    <div className="card bg-primary text-white shadow">
                                    <div className="card-body">
                                        <input type='text'
                                            className="form-control "
                                            placeholder='Email To'
                                            size={emailPreview.to.length}
                                            value={emailPreview.to} onChange={e => {
                                                setCustomFieldMapping(prev => {
                                                    return {
                                                        ...prev,
                                                        paymentUIRelated: {
                                                            ...(prev.paymentUIRelated || emailPreviewDef),
                                                            to: e.target.value,
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
        return <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={async e => {
            e.preventDefault();
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
            console.log('custfooterfinderles', leaseInfo, formatedData)
        }}>Email</button>
    },
};

export const houseInfoDef: ITableAndSheetMappingInfo = {    
    table: 'houseInfo',
    sheetMapping: {
        sheetName: 'House Info',
        range: 'A1:I',
        mapping: [
            'houseID', 'address', 'city', 'zip',
            '', //type
            '', //beds
            '', //rooms
            '', //sqrt
            'ownerName'
        ],
    }
}

export const tenantInfoDef: ITableAndSheetMappingInfo = {
    table: 'tenantInfo',
    sheetMapping: {
        sheetName: 'Tenants Info',
        range: 'A1:G',
        mapping: [
            'tenantID',
            'firstName',
            'lastName',
            'fullName',
            'phone',
            'email',
            'comment',
        ],
    }
}

export const maintenanceInfoDef: ITableAndSheetMappingInfo = {
    table: 'maintenanceRecords',
    sheetMapping: {
        sheetName: 'MaintainessRecord',
        range: 'A1:G',
        mapping: [
            'maintenanceID',
            'date',
            'description',
            'amount',
            'houseID', //rename to prevent default handling
            'expenseCategoryId',
            'workerID',
            'comment'
        ],
    },

    sortFields: ['date', 'houseID'],
    title: 'Maintenance Records',
}


export const leaseInfoDef: ITableAndSheetMappingInfo = {
    table: 'leaseInfo',
    sheetMapping: {
        sheetName: 'Lease Info',
        range: 'A1:Q',
        mapping: [
            'leaseID',
            'houseID',
            'startDate',
            'endDate',
            'monthlyRent',
            'deposit',
            'petDeposit',
            'otherDeposit',
            'comment',
            'reasonOfTermination',
            'terminationDate',
            'terminationComments',
            'tenant1',
            'tenant2',
            'tenant3',
            'tenant4',
            'tenant5', //not here, added to force mapping
        ],
    },
}


const ownerInfoDef: ITableAndSheetMappingInfo = {
    table: 'ownerInfo'
}


export const tableNameToDefinitions = [tenantInfoDef, houseInfoDef, paymentInfoDef, workerInfoDef, maintenanceInfoDef,
    leaseInfoDef,
    ownerInfoDef,
].reduce((acc, pp) => {
    acc.set(pp.table, pp);
    return acc;
}, new Map<TableNames, ITableAndSheetMappingInfo>());