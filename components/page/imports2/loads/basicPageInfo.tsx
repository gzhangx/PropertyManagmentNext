import { IPageInfo } from '../types'

export function getBasicPageDefs() {
    return {
        lease: {
            pageName: 'Lease Info',
            range: 'A1:M',
            fieldMap: [
                '',
                'address',
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
                'tenant', //not here, added to force mapping
            ],
            displayColumnInfo: [
                {
                    field: 'address',
                    name: 'House'
                },
                {
                    field: 'tenant',
                    name: 'Tenant'
                },
                {
                    field: 'startDate',
                    name: 'Start Date'
                },
                {
                    field: 'endDate',
                    name: 'End Date'
                },
                {
                    field: 'deposit',
                    name: 'Deposit'
                },
                {
                    field: 'comment',
                    name: 'comment'
                },
                
            ],
            idField: 'address',
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
            displayColumnInfo: [
                {
                    field: 'firstName',
                    name: 'First Name'
                },
                {
                    field: 'fullName',
                    name: 'Full Name'
                },
                {
                    field: 'phone',
                    name: 'phone'
                },
                {
                    field: 'email',
                    name: 'email'
                },
                {
                    field: 'comment',
                    name: 'comment'
                },
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
                'mntAddress', //rename to prevent default handling
                'expenseCategoryId',
                'workerID',
                'comment'
            ],
            displayColumnInfo: [
                {
                    field: 'date',
                    name: 'Date',
                },
                {
                    field: 'description',
                    name: 'Description',
                },
                {
                    field: 'amount',
                    name: 'Amount',
                },
                {
                    field: 'mntAddress',
                    name: 'Address',
                },
                {
                    field: 'expenseCategoryId',
                    name: 'ExpenseCategoryId',
                },
                {
                    field: 'workerID',
                    name: 'Worker',
                },
            ],
            idField:'date',
        } as IPageInfo,
    }
}