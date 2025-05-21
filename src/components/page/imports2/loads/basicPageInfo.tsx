// import { IPageInfo } from '../types'

// export function getBasicPageDefs() {
//     return {
//         lease: {
//             pageName: 'Lease Info',
//             range: 'A1:M',
//             fieldMap: [
//                 'lIdNotUsed',
//                 'address',
//                 'startDate',
//                 'endDate',
//                 'monthlyRent',
//                 'deposit',
//                 'petDeposit',
//                 'otherDeposit',
//                 'comment',
//                 'reasonOfTermination',
//                 'terminationDate',
//                 'terminationComments',
//                 'tenant1',
//                 'tenant2',
//                 'tenant3',
//                 'tenant4',
//                 'tenant', //not here, added to force mapping
//             ],
//             displayColumnInfo: [
//                 {
//                     field: 'address',
//                     name: 'House'
//                 },
//                 {
//                     field: 'tenant',
//                     name: 'Tenant'
//                 },
//                 {
//                     field: 'startDate',
//                     name: 'Start Date'
//                 },
//                 {
//                     field: 'endDate',
//                     name: 'End Date'
//                 },
//                 {
//                     field: 'deposit',
//                     name: 'Deposit'
//                 },
//                 {
//                     field: 'comment',
//                     name: 'comment'
//                 },
                
//             ],
//             sheetMustExistField: 'address',
//         } as IPageInfo,
//         paymentRecord: {
//             pageName: 'PaymentRecord',
//             range: 'A1:F',
//             idField: 'receivedDate',
//         },
//         houseInfo: {
//             pageName: 'House Info',
//             range: 'A1:I',
//             fieldMap: [
//                 '', 'address', 'city', 'zip',
//                 '', //type
//                 '', //beds
//                 '', //rooms
//                 '', //sqrt
//                 'ownerName'
//             ],
//             idField: 'address',
//         },
//         tenant: {
//             pageName: 'Tenants Info',
//             range: 'A1:G',
//             fieldMap: [
//                 '',
//                 'firstName',
//                 'lastName',
//                 'fullName',
//                 'phone',
//                 'email',
//                 'comment',
//             ],
//             displayColumnInfo: [
//                 {
//                     field: 'firstName',
//                     name: 'First Name'
//                 },
//                 {
//                     field: 'fullName',
//                     name: 'Full Name'
//                 },
//                 {
//                     field: 'phone',
//                     name: 'phone'
//                 },
//                 {
//                     field: 'email',
//                     name: 'email'
//                 },
//                 {
//                     field: 'comment',
//                     name: 'comment'
//                 },
//             ],
//             sheetMustExistField: 'fullName',
//         } as IPageInfo,
//         maintenceRecords: {
//             pageName: 'MaintainessRecord',
//             range: 'A1:G',
//             fieldMap: [
//                 'date',
//                 'description',
//                 'amount',
//                 'maintenanceImportAddress', //rename to prevent default handling
//                 'expenseCategoryId',
//                 'workerID',
//                 'comment'
//             ],
//             displayColumnInfo: [
//                 {
//                     field: 'date',
//                     name: 'Date',
//                 },
//                 {
//                     field: 'description',
//                     name: 'Description',
//                 },
//                 {
//                     field: 'amount',
//                     name: 'Amount',
//                 },
//                 {
//                     field: 'maintenanceImportAddress',
//                     name: 'Address',
//                 },
//                 {
//                     field: 'expenseCategoryId',
//                     name: 'ExpenseCategoryId',
//                 },
//                 {
//                     field: 'workerID',
//                     name: 'Worker',
//                 },
//             ],
//             sheetMustExistField:'date',
//         } as IPageInfo,
//     }
// }