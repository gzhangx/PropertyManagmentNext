import { matchItems} from '../../../../components/page/imports2/utils'
import {IDbRowMatchData, IDbSaveData, ISheetRowData, ROWDataType} from "../../../../components/page/imports2/types";
import assert from 'assert';

describe('HelperTests', function(){
    function getFakeSheetRowData(ref: string, ref2?: string) : ISheetRowData {
        const ret: ISheetRowData = {
            dataType: 'Sheet',
            needUpdate: true,
            displayData: null,
            importSheetData: {
                ref,
            },
            invalid: '',
            matched: null,
            matchToKey: null,
            matcherName: '',
        };
        if (ref2) {
            ret.importSheetData.ref2 = ref2;
        }
        return ret;
    }
    function getFakeDbRowData(ref: string, ref2?: string) : IDbRowMatchData {
        const ret: IDbRowMatchData = {
            dataType: 'DB',
            dbItemData: {
                ref,
            },
            matchedToKey: '',
        };
        if (ref2) {
            ret.dbItemData.ref2 = ref2;
        }
        return ret;
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
        assert.deepEqual(sheetData.map(d=>{
            return {
                matched: d.matched?.ref,
                matchedToKey: d.matchToKey,
                matcherName: d.matcherName,
                needUpdate: d.needUpdate,
            }
        }), [{
            matched: '1',
            matchedToKey: '1',
            matcherName: 'fake',
            needUpdate: false,
        },{
            matched: undefined,
            matchedToKey:null,
            matcherName: '',
            needUpdate: true,
        }])
    });


    it('should matchItem 2 steps', function() {
        const sheetData: ISheetRowData[] =[
            getFakeSheetRowData('1', '1'),
            getFakeSheetRowData('1', '2'),
        ];
        const dbData: IDbRowMatchData[] = [
            getFakeDbRowData('1', '1'),
            getFakeDbRowData('2', '2'),
        ];

        const matchRes1 = matchItems(sheetData, dbData, {
            name:'fake',
            getRowKey: (data: IDbSaveData, src) => {
                return (data.ref+'_'+data.ref2) as string;
            }
        });
        assert.equal(matchRes1, true);
        assert.deepEqual(sheetData.map(d=>{
            return {
                matched: d.matched?.ref,
                matchedToKey: d.matchToKey,
                matcherName: d.matcherName,
                needUpdate: d.needUpdate,
            }
        }), [{
            matched: '1',
            matchedToKey: '1_1',
            matcherName: 'fake',
            needUpdate: false,
        },{
            matched: undefined,
            matchedToKey:null,
            matcherName: '',
            needUpdate: true,
        }]);

        const matchRes2 = matchItems(sheetData, dbData, {
            name:'fake',
            getRowKey: (data: IDbSaveData, src) => {
                return data.ref as string;
            }
        });

        assert.deepEqual(sheetData.map(d=>{
            return {
                matched: d.matched?.ref,
                matchedToKey: d.matchToKey,
                matcherName: d.matcherName,
                needUpdate: d.needUpdate,
            }
        }), [{
            matched: '1',
            matchedToKey: '1_1',
            matcherName: 'fake',
            needUpdate: false,
        },{
            matched: undefined,
            matchedToKey:null,
            matcherName: '',
            needUpdate: true,
        }]);

    });

})