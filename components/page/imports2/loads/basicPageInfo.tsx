import { IPageInfo } from '../types'

export function getBasicPageDefs() {
    return {
        lease: {
            pageName: 'Lease Info',
            range: 'A1:M',
            fieldMap: [
                '',
                'houseID',
                'startDate',
                'endDate',
                'monthlyRent',
                'deposit',
                'petDeposit',
                'otherDeposit',
                'comment',
                'tenant1',
                'tenant2',
                'tenant3',
                'tenant4',
            ],
            idField: 'houseID',
        } as IPageInfo,
        paymentRecord: {
            pageName: 'PaymentRecord',
            range: 'A1:F',
            fieldMap: [
                'receivedDate',
                'receivedAmount',
                'houseID',
                'paymentTypeID',
                'paymentProcessor',
                //'paidBy',
                'notes',
                //'created',
                //'modified',                
                //'month',                
                //'ownerID',
            ],
            idField: 'receivedDate',
        },
        houseInfo: {
            pageName: 'House Info',
            range: 'A1:I',
            fieldMap: [
                '', 'address', 'city', 'zip',
                '', //type
                '', //beds
                '', //rooms
                '', //sqrt
                'ownerName'
            ],
            idField: 'address',
        },
        tenant: {
            pageName: 'Tenants Info',
            range: 'A1:G',
            fieldMap: [
                '',
                'firstName',
                'lastName',
                'fullName',
                'phone',
                'email',
                'comment',
            ],
            idField: 'fullName',
        } as IPageInfo,
        maintenceRecords: {
            pageName: 'MaintainessRecord',
            range: 'A1:G',
            fieldMap: [
                'date',
                'description',
                'amount',
                'houseID',
                'expenseCategoryId',
                'workerID',
                'comment'
            ],
            idField:'date',
        } as IPageInfo,
    }
}