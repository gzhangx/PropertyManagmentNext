import { IDbSaveData, IRowComparer, IStringDict, ISheetRowData, IPageDataDetails, ALLFieldNames, IPageParms, IDbRowMatchData } from '../types'
import { IMaintenanceRawData } from '../../../reportTypes';
import { Promise } from 'bluebird';

import { genericPageLoader } from '../helpers';
import * as pageDefs from '../pageDefs'
import { IPageStates } from '../types';

import * as lutil from './util';
import moment from 'moment';
import * as api from '../../../api'

function fixDates(date: string): string {
    const mnt = moment(date);
    if (mnt.isValid()) return mnt.format('YYYY-MM-DD');
    return date;
}
export const maintenanceRowCompare: IRowComparer[] = [
    {
        name: 'Maintenance Row Comparer',
        getRowKey: (data: IDbSaveData, source) => {
            const le = data as any as IMaintenanceRawData;
            let amt: any = le.amount;
            if (typeof amt === 'number') {
                amt = amt.toFixed(2);
                //console.log(`'${source}' type of amt ${typeof amt}`, amt)
            } else {
                //console.log(`'${source}' type of amt ${typeof amt}`,amt)
            }
            const date = fixDates(le.date);            
            const key = `a=${amt}:d=${date}:hid=${le.houseID}:wid=${(le.workerID)}:expCat=${(le.expenseCategoryId)}:cmt=${(le.comment)}`;
            //console.log(`key(${source})====`,key)
            //if (source === 'DB') console.log('tempshow db data', data);
            return key;
        },
        checkRowValid(data) {
            const le = data as any as IMaintenanceRawData;
            if (!le.workerID) return 'worker not saved';
            if (!le.houseID) return 'House Not Saved'
            return null;
        },
    }
];



export async function maintenanceExtraProcessSheetData(datasInput: ISheetRowData[], pageState: IPageStates): Promise<ISheetRowData[]> {

    /*
    const leasePageInfo = pageDefs.getPageDefs().find(p => p.pageName === 'Tenants Info');
    const tenantsRowSheet = await genericPageLoader(null, {
        ...pageState,
        curPage: leasePageInfo,
    });
    const tenantsByName = tenantsRowSheet.dataRows.reduce((acc, dr) => {
        acc[lutil.getStdLowerName(dr.importSheetData['fullName'].toString())] = dr;
        return acc;
    }, {} as ILeaseItemByName);
*/

    return datasInput;
}

export function displayItem(params: IPageParms, state: IPageStates, sheetRow: ISheetRowData, field: ALLFieldNames): JSX.Element {
    if (field === 'startDate') return null;
    const displayStrValue = sheetRow.displayData[field];
    const tnameTag = lutil.getStdLowerName(displayStrValue?.toString());
    if (field === 'address') {
        const houseID = sheetRow.importSheetData['houseID'];
        if (!houseID) {
            return <div>{displayStrValue} (!!No sheet value)</div>;
        } 
    }
    return <div>{displayStrValue}</div>;
}

export function displayDbExtra(params: IPageParms, state: IPageStates, dbMatch: IDbRowMatchData, field: ALLFieldNames) {
    if (field === 'address') {
        return <button className='btn btn-primary' onClick={() => {
            const maintenanceID = dbMatch.dbItemData['maintenanceID'] as string;
            console.log('delete', maintenanceID)
            /*
            api.deleteLeases(maintenanceID).then(res => {
                console.log('delete got', res);
                const newdbMatchData = state.pageDetails.dbMatchData.filter(d => d.dbItemData['leaseID'] !== leaseID)
                params.dispatchCurPageState(state => ({
                    ...state,
                    pageDetails: {
                        ...state.pageDetails,
                        dbMatchData: newdbMatchData,
                    }
                }))
            })
            */
        }}>Delete({dbMatch.dbItemData[field]} (NOT IMPLEMENTED))</button>
    }
    return dbMatch.dbItemData[field];
}

