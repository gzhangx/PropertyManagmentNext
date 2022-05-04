import { IPageInfoBasic } from '../types'

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
        } as IPageInfoBasic,
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
        } as IPageInfoBasic,
        maintenceRecords: {
            pageName: 'Maintenance Records',
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
        } as IPageInfoBasic,
    }
}