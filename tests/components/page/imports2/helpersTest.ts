import { matchItems} from '../../../../components/page/imports2/helpers'
import {IDbRowMatchData, IDbSaveData, ISheetRowData, ROWDataType} from "../../../../components/page/imports2/types";

describe('HelperTests', function(){

    it('should pass', ()=>{
        const test = {
            dataType: 'Sheet',
            needUpdate: false,
            displayData: null,
            importSheetData: {
                ref:'1',
            },
            invalid: '',
            matched: null,
            matchToKey: '',
            matcherName: '',
        } as ISheetRowData;
    });

    function getFakeSheetRowData(ref: string) : ISheetRowData {
        return {
            dataType: 'Sheet',
            needUpdate: false,
            displayData: null,
            importSheetData: {
                ref,
            },
            invalid: '',
            matched: null,
            matchToKey: '',
            matcherName: '',
        };
    }
    function getFakeDbRowData(ref: string) : IDbRowMatchData {
        return {
            dataType: 'DB',
            dbItemData: {
                ref,
            },
            matchedToKey: '',
        };
    }

    it('should matchItem ', function() {
        const sheetData: ISheetRowData[] =[
            getFakeSheetRowData('1'),
        ];
        const dbData: IDbRowMatchData[] = [getFakeDbRowData('1')];
        /*
        matchItems(sheetData, dbData, {
            name:'fake',
            getRowKey: (data: IDbSaveData, src) => {
                return data.ref as string;
            }
        })

         */
    });

})