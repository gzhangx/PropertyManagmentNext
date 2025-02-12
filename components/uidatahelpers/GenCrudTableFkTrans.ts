// import { IEditTextDropdownItem } from "../generic/GenericDropdown";

// interface IFK {
//     field: string;
//     table: string;
// }

// interface IData {
//     [key: string]: string;
// }

// export interface IFKDefs {
//     [tbl: string]: {
//         processForeignKey: (fk: IFK, datas: IData[]) => IEditTextDropdownItem[];
//     };
// }
// export function getFKDefs(): IFKDefs {
//     return {
//         ownerInfo: {
//             processForeignKey: (fk: IFK, datas: IData[]) => {
//                 return datas.map(data => {
//                     return {
//                         value: data[fk.field],
//                         label: data['ownerName']
//                     }
//                 })
//             },
//         },
//         houseInfo: {
//             processForeignKey: (fk: IFK, datas: IData[]) => {
//                 return datas.map(data => {
//                     return {
//                         value: data[fk.field],
//                         label: data['address']
//                     }
//                 })
//             },
//         },
//         workerInfo: {
//             processForeignKey: (fk: IFK, datas: IData[]) => {
//                 return datas.map(data => {
//                     return {
//                         value: data[fk.field],
//                         label: data['firstName'] + ' ' + data['lastName'],
//                     }
//                 });
//             },
//         },
//         leaseInfo: {
//             processForeignKey: (fk: IFK, datas: IData[]) => {
//                 return datas.map(data => {
//                     return {
//                         value: data[fk.field],
//                         label: data['comment'],
//                     }
//                 });
//             },
//         },
//         paymentType: {
//             processForeignKey: (fk: IFK, datas: IData[]) => {
//                 return datas.map(data => {
//                     return {
//                         value: data[fk.field],
//                         label: data['paymentTypeName'],
//                     }
//                 });
//             },
//         },
//     };
// }