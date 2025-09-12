import { ITableAndSheetMappingInfo } from "../datahelperTypes";
import { customHeaderFilterFuncWithHouseIDLookup } from "./util";

export const maintenanceInfoDef: ITableAndSheetMappingInfo<unknown> = {
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
editTitle:'Add/Edit Maintenance Record',
    displayFields: [
        { field: 'date', 'desc': 'Date', type: 'date', displayType: 'date' },
        { field: 'description', 'desc': 'Description', type: 'string' },
        { field: 'amount', 'desc': 'Amount', type: 'decimal', displayType: 'currency' },
        { field: 'houseID', 'desc': 'House' },
        { field: 'expenseCategoryId', 'desc': 'Category', type: 'string' },
        { field: 'workerID', 'desc': 'Workers/Contractors' },
        { field: 'comment', 'desc': 'Comment', type: 'string' },
    ],
    sortFields: ['date', 'houseID'],
    title: 'Maintenance Records',
    customHeaderFilterFunc: (mainCtx, pageState, colInfo) => {
        return customHeaderFilterFuncWithHouseIDLookup(mainCtx, pageState, colInfo, 'maintenanceRecords');
        },

}
