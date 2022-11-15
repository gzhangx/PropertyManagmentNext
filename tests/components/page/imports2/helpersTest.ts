import { matchItems} from '../../../../components/page/imports2/utils'
import {IDbRowMatchData, IDbSaveData, ISheetRowData, ROWDataType} from "../../../../components/page/imports2/types";
import assert from 'assert';

describe('HelperTests', function(){
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
            getFakeSheetRowData('1'),
        ];
        const dbData: IDbRowMatchData[] = [
            getFakeDbRowData('1'),
            getFakeDbRowData('2'),
        ];

        const matchRes = matchItems(sheetData, dbData, {
            name:'fake',
            getRowKey: (data: IDbSaveData, src) => {
                return data.ref as string;
            }
        });
        assert.equal(matchRes, true);
    });

})