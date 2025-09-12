import moment from "moment";
import { ALLFieldNames, ITableAndSheetMappingInfo } from "../datahelperTypes";
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

    customFooterButton(params) {
        const { mainCtx, crudAddCustomObjMap, setCrudAddCustomObjMap, editItem } = params;        
        
        const customFooterUI = <>
            <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={async e => {
                e.preventDefault();
                params.columnInfo.map((c) => {
                    if (c.isId) {
                        delete editItem.data[c.field as ALLFieldNames];
                    } else if (c.field === 'date') {
                        editItem.data[c.field as ALLFieldNames] = moment().format('YYYY-MM-DD');
                    }
                });
                //await params.handleSubmit(e);
                params.setEditItem({ ...editItem, data: { ...editItem.data } });
                params.setDspState('Add');
            }}>Duplicate</button>
            <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={
                async e => {
                    await params.handleSubmit(e);                    
                }
            }>{params.addUpdateLabel}</button>
        </>
        return {
            customFooterUI,
        }
    },
}
