
import { ALLFieldNames, PageNames } from "../page/imports2/types";
import { IDBFieldDef, TableNames } from "../types";


export type DataToDbSheetMapping ={
    sheetName: PageNames;
    range: string;
    mapping: ALLFieldNames[];
    //endCol: string;
}


export interface ITableAndSheetMappingInfo {
    table: TableNames;
    displayFields?: IDBFieldDef[];
    sheetMapping?: DataToDbSheetMapping;  //how googleSheet maps to db, used to save data to sheet
}