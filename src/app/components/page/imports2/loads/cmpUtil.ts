// import { IPageStates, PageNames, ISheetRowData } from '../types';
// import * as pageDefs from '../pageDefs'
// import { genericPageLoader } from '../helpers';
// import * as lutil from './util';

// export interface ICmpItemByName { [key: string]: ISheetRowData; }
// export async function getRelatedTableByName(pageState: IPageStates, pageName: PageNames): Promise<ICmpItemByName> {
//     const xPageInfo = pageDefs.getPageDefs().find(p => p.pageName === pageName);
//     const xRowSheet = await genericPageLoader(null, {
//         ...pageState,
//         curPage: xPageInfo,
//     });
//     const xByName = xRowSheet.dataRows.reduce((acc, dr) => {
//         acc[lutil.getStdLowerName(dr.importSheetData['address'].toString())] = dr;
//         return acc;
//     }, {} as ICmpItemByName);
//     return xByName;
// }