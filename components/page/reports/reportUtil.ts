import moment from 'moment';
import { sortBy, sum } from 'lodash';
import { IExpenseData, IHouseInfo, IPayment, IPaymentCalcOpts } from '../../reportTypes';
import { TOTALCOLNAME, fMoneyformat } from '../../states/PaymentExpenseState';


export interface IAmountAndPmtRecords {
    amount: number;
    records: IPayment[];
}
export interface MonthlyHouseData {
    monthes: {
        [mon: string]: IAmountAndPmtRecords;  //{amount: number,records: IPayment[],};
    };
    isNotRent: boolean;
    addressId: string;
    address: string;
    displayName: string;
    records: IPayment[],
    total: number,
}

export interface MonthlyPaymentData {
    monthAry: string[];
    monthByKey: { [mon: string]: boolean };
    houseAry: MonthlyHouseData[];
    houseByKey: { [id: string]: MonthlyHouseData };

    nonRentByKey: { [id: string]: MonthlyHouseData };
    nonRentAry: MonthlyHouseData[];
    monthTotal: {
        [mon: string]: number;
    };
    dbgMonthTotalRecords: {
        [mon: string]: IPayment[];
    };
    total: number;

    [houseAry:string]: any;
};

export function getPaymentsByMonthAddress(paymentsByMonth: IPayment[], opts: IPaymentCalcOpts): MonthlyPaymentData {
    if (!opts) opts = {
        isGoodMonth: () => true,
        isGoodHouseId: () => true,
        isGoodWorkerId: ()=> true,
        getHouseShareInfo: ()=>[],
    };
    const { isGoodMonth, isGoodHouseId, getHouseShareInfo } = opts;
    ///
    /// paymentsByMonth: Array of
//     {
//     "paymentID": "6ed8ccd0-c428-11eb-b1ce-cdccdf295589",
//     "receivedDate": "2020-09-02T04:00:00.000Z",
//     "receivedAmount": 830,
//     "paidBy": null,
//     "notes": "",
//     "month": "2020-09",
//     "paymentTypeID": "6ed65bd0-c428-11eb-b1ce-cdccdf295589",
//     "houseID": "69e0acc0-c428-11eb-b1ce-cdccdf295589",
//     "paymentProcessor": null,
//     "vdPosControl": null,
//     "created": "2021-06-03T04:59:10.000Z",
//     "modified": "2021-06-03T04:59:10.000Z",
//     "paymentTypeName": "Rent",
//     "includeInCommission": "1",
//     "address": "xxxxx addr",
//     "addressId": "69e0acc0-c428-11eb-b1ce-cdccdf295589",
//     "source": null,
//     "ownerName": "xxx",
//     "ownerID": "e6634780-c1cb-11eb-8bff-37dbc12ce7aa",
//     "date": "2020-09-02",
//     "amount": ###,
//     "total": ###
// }

    
    const monAddr = paymentsByMonth.reduce((acc, d) => {
        //console.log(d);
        if (!isGoodMonth(d.month)) return acc;        
        if (!isGoodHouseId(d.houseID)) return acc;
        const isNotRent = (d.paymentTypeName ||'').toLowerCase() !== 'rent';
                
        const catByKey = isNotRent ? acc.nonRentByKey : acc.houseByKey;
        const catAry = isNotRent ? acc.nonRentAry : acc.houseAry;
        const catId = isNotRent ? d.paymentTypeName : d.addressId;
        let addData = catByKey[catId];
        if (!addData) {
            addData = {
                monthes: {},
                isNotRent,
                addressId: d.addressId,
                address: d.address,
                displayName: isNotRent ? d.paymentTypeName : d.address,
                records: [],
                total: 0,
            } as MonthlyHouseData;
            catByKey[catId] = addData;
            catAry.push(addData);
        }

        let monData = addData.monthes[d.month];
        if (!monData) {
            monData = {
                amount: 0,
                records: [],
            };
            addData.monthes[d.month] = monData;
        }
        const damount = d.amount; //calcHouseSpreadShare(d.amount, isNotRent);
        
        //monData[TOTALCOLNAME] += damount;
        acc.total += damount;
        
        if (!acc.monthByKey[d.month]) {
            acc.monthByKey[d.month] = true;
            acc.monthAry.push(d.month);
        }
        monData.amount += damount;
        monData.records.push(d);
        addData.total += damount;
        addData.records.push(d);
        acc.monthTotal[d.month] = (acc.monthTotal[d.month] || 0) + damount;
        if (!acc.dbgMonthTotalRecords[d.month]) {
            acc.dbgMonthTotalRecords[d.month] = [];
        }
        acc.dbgMonthTotalRecords[d.month].push(d);
        return acc;
    }, {
        monthAry: [],
        monthByKey: {},
        houseAry: [],
        houseByKey: {},

        nonRentByKey: {},
        nonRentAry: [],

        monthTotal: {},
        dbgMonthTotalRecords: {},
        total: 0,
    } as MonthlyPaymentData);

    monAddr.monthAry.sort();
    ['houseAry', 'nonRentAry'].forEach(name => {
        monAddr[name] = sortBy(monAddr[name], ['displayName']);
    })    

    return monAddr;
}

export interface IMaintenanceMonthCatAmtRec {
    month: string;
    amount: number;
    category: string;
    address: string;
    houseID: string;
    records: IExpenseData[];
};

export interface IMaintenanceMonthWorkerAmtRec {
    workerID: string;
    month: string;
    totalAmountWokerMonth: number;
    records: IExpenseData[];
}

export interface IMaintenceCatMonData 
{
    amount: number;
    records: IMaintenanceMonthCatAmtRec[];
    amountCalcParts: IMaintenanceMonthCatAmtRecWithHousePartCalc[];
};

interface IMaintenceAmtByHouseByCat {
    amount: number;
    records: IHousePartsCalcInfo[];
}

export interface IMaintenanceDataByMonthRes {    
    monthByName: {[mon:string]:{ total: number}},
    monthes: string[],
    categoriesByKey: {
        [cat: string]: {
            [mon: string]: IMaintenceCatMonData;
        }
    },    
    categoryNames: string[],
    categoryTotals: {
        [cat: string]: number;
    },
    monthlyTotal: {
        [mon: string]: number;
    },
    total: 0,    
    byHouseIdByCat: {
        [houseId: string]: {
            [cat: string]: IMaintenceAmtByHouseByCat;
        }
    },
    byHouseIdOnly: {
        [houseId: string]: IMaintenceAmtByHouseByCat;        
    },
    houses: IHouseInfo[];
    getCatMonth: ((cat: string, mon: string) => IMaintenceCatMonData);
    totalExpByHouse: number; //a santity check
}


export interface IMaintenanceDataByWorkerMonthRes {
    monthByName: { [mon: string]: { total: number } };
    monthes: string[];
    byWorkerByMonth: {
        [workerID: string]: {
            [mon: string]: IMaintenanceMonthWorkerAmtRec;
        }
    };
    workerIDs: string[];
    workerTotals: {
        [workerID: string]: number;
    };
    monthlyTotal: {
        [mon: string]: number;
    };
    total: 0;
}


export interface IHousePartsCalcInfo {
    curTotal: number;
    house: IHouseInfo;
    amount: number;
    dspAmount: string;
    info: string;
}

export interface IMaintenanceMonthCatAmtRecWithHousePartCalc extends IMaintenanceMonthCatAmtRec {
    calcInfo: IHousePartsCalcInfo[];
    message?: string;
}

export function getMaintenanceData(maintenanceRecordsRaw: IExpenseData[], opts: IPaymentCalcOpts): IMaintenanceDataByMonthRes {
    if (!opts) opts = {
        isGoodMonth: () => true,
        isGoodHouseId: () => true,
        isGoodWorkerId: ()=>true,
        getHouseShareInfo: () => [],
    };

    
    const maintenanceRecords = maintenanceRecordsRaw.reduce((acc, r) => {
        const key = `${r.month}-${r.houseID}-${r.expenseCategoryName}`;
        let keyData = acc.keys[key];
        if (!keyData) {
            keyData = {
                month: r.month,
                amount: 0,
                category: r.category,
                address: r.address,
                houseID: r.houseID,
                records: [],
            } as IMaintenanceMonthCatAmtRec;
            acc.keys[key] = keyData;
            acc.data.push(keyData);
        }
        keyData.amount += r.amount;
        keyData.records.push(r);
        return acc;
    }, {
        data: [] as IMaintenanceMonthCatAmtRec[],
        keys: {} as { [id: string]: IMaintenanceMonthCatAmtRec},
    }).data;
    const { isGoodMonth, isGoodHouseId, getHouseShareInfo } = opts;
    const houseInfo = getHouseShareInfo();
    const validHouseIds = houseInfo.reduce((acc, h) => {        
        acc[h.houseID] = true;
        return acc;
    }, {} as { [id: string]: boolean });
    const calcHouseSpreadShare = (r: IMaintenanceMonthCatAmtRec) => {
        const ramount = r.amount;
        if (isGoodHouseId(r.houseID)) {
            return {
                ...r, amount: ramount,
                calcInfo: [
                    {
                        curTotal: ramount,
                        amount: ramount,
                        dspAmount: ramount.toFixed(2),
                        house: {
                            ...r,
                            ownerName: '', city: '', state: '', zip:''
                        },
                        info: `${r.address} ==> ${(ramount).toFixed(2)} of ${r.category}`,
                    } as IHousePartsCalcInfo
                ]
            } as IMaintenanceMonthCatAmtRecWithHousePartCalc;
        }
        if (r.address) return { amount: 0 } as IMaintenanceMonthCatAmtRecWithHousePartCalc; //belong to a not shown house.
        //need to return based on enabled house shares.
        
        if (!houseInfo.length)
            return { ...r, amount: ramount, message: 'Warning: no house found return as is' } as IMaintenanceMonthCatAmtRecWithHousePartCalc;
        const total = Math.round(ramount * 100);
        const eachShare = Math.trunc(total / houseInfo.length);
        const anchorShare = total - (eachShare * (houseInfo.length - 1));

        const calcRes = houseInfo.reduce((acc, h) => {
            if (isGoodHouseId(h.houseID)) {
                const amount100 = (acc.amount+anchorShare+0.0001>=total) ? anchorShare : eachShare;
                const curTotal = acc.amount;
                acc.amount += amount100;
                const amount = amount100 / 100.0;
                const dspAmount = amount.toFixed(2);
                acc.calcInfo.push({
                    curTotal,
                    house: { houseID: h.houseID, address: h.address, ownerName: '', city: '', state: '', zip:'' },
                    amount,
                    dspAmount,
                    info: `${h.address} ${dspAmount} cumulated: ${(acc.amount/100).toFixed(2)} from total ${r.amount.toFixed(2)} of ${r.category}`,
                });                
            }
            acc.validHouseIds[h.houseID] = true;
            return acc;
        }, {
            validHouseIds: {} as {[id:string]:boolean},
            amount: 0,
            calcInfo: [] as IHousePartsCalcInfo[],
        });
        return {
            ...r,
            amount: calcRes.amount / 100.0,
            calcInfo: calcRes.calcInfo,
        } as IMaintenanceMonthCatAmtRecWithHousePartCalc;
    }

    const maintenceData: IMaintenanceDataByMonthRes = maintenanceRecords.reduce((acc, r) => {
        const month = r.month.length === 7? r.month:moment(r.month).add(2, 'days').format('YYYY-MM');
        if (!isGoodMonth(month)) return acc;
        if (!isGoodHouseId(r.houseID) && !r.houseID) return acc;
        
        const getSetIfNull = (dict: {[id:string]:object}, name: string, def: object|null) => {
            if (!dict[name])
                dict[name] = def || {};
            return dict[name];
        }
        let monthData = acc.monthByName[month];
        if (!monthData) {
            acc.monthByName[month] = {
                total: 0,
            };
            acc.monthes.push(month);
        }
        let cats = acc.categoriesByKey[r.category];
        if (!cats) {
            cats = { };
            acc.categoriesByKey[r.category] = cats;
            acc.categoryNames.push(r.category);
        }
        
        const calcInfo = calcHouseSpreadShare(r);
        const amount = calcInfo.amount;
        let catMonth = cats[month];
        if (!catMonth) {
            catMonth = {
                amount: 0,
                records: [],
                amountCalcParts: [],
            }
            cats[month] = catMonth;
        }
        catMonth.amount += amount;
        if (amount) {
            catMonth.amountCalcParts.push(calcInfo);
            calcInfo.calcInfo.forEach(ci => {
                if (!acc.byHouseIdByCat[ci.house.houseID]) {
                    acc.houses.push(ci.house);
                }
                const cat = getSetIfNull(getSetIfNull(acc.byHouseIdByCat, ci.house.houseID, {}) as {[id:string]:object}, r.category, {
                    amount: 0,
                    records: [],
                }) as IMaintenceAmtByHouseByCat;
                
                cat.amount += ci.amount;
                cat.records.push(ci);

                const hs = getSetIfNull(acc.byHouseIdOnly, ci.house.houseID, { amount: 0, records: [], }) as IMaintenceAmtByHouseByCat;
                hs.amount += ci.amount;
                hs.records.push(ci);

                acc.totalExpByHouse += ci.amount;    
            });
            
        } else {
            console.log(`Impossible !!!!!!! for r`);
            console.log(r);
        }
        catMonth.records.push(r);
        acc.categoryTotals[r.category] = (acc.categoryTotals[r.category] || 0) + amount;
        acc.monthlyTotal[month] = (acc.monthlyTotal[month] || 0) + amount;

        acc.total += amount;
        return acc;
    }, {
        monthByName: {},
        monthes: [],
        categoriesByKey: {},
        categoryNames: [],
        categoryTotals: {},
        workerIDs: [],
        workerTotals: {},
        byWorkerByMonth: {},
        monthlyTotal: {},
        total: 0,
        getCatMonth: () => ({
            amount: 0,
            amountCalcParts: [],
            records:[],
        }),
        byHouseIdByCat: {},
        byHouseIdOnly: {},
        houses: [],
        totalExpByHouse: 0,
    } as IMaintenanceDataByMonthRes);

    const sortLowOthers = (cats: string[]) => {
        const others = 'Others';
        const res = cats.filter(k => k !== others);
        res.sort();
        if (cats.filter(k => k === others).length) {
            res.push(others);
        }
        return res;
    }

    maintenceData.categoryNames = sortLowOthers(maintenceData.categoryNames);
    maintenceData.getCatMonth = (cat: string, mon:string) => {
        const catMon = maintenceData.categoriesByKey[cat];
        if (!catMon) return {} as IMaintenceCatMonData;
        return (catMon[mon] || {}) as IMaintenceCatMonData;
    };
    return maintenceData;
}



export function getMaintenanceDataByWorker(maintenanceRecordsRaw: IExpenseData[], opts: IPaymentCalcOpts): IMaintenanceDataByWorkerMonthRes {
    if (!opts) opts = {
        isGoodMonth: () => true,
        isGoodHouseId: () => true,
        isGoodWorkerId: () => true,
        getHouseShareInfo: () => [],
    };

    const { isGoodMonth, getHouseShareInfo, isGoodWorkerId } = opts;
    const houseInfo = getHouseShareInfo();
    const validHouseIds = houseInfo.reduce((acc, h) => {
        acc[h.houseID] = true;
        return acc;
    }, {} as { [id: string]: boolean });
   

    const maintenceData: IMaintenanceDataByWorkerMonthRes = maintenanceRecordsRaw.reduce((acc, r) => {
        const month = r.month.length === 7 ? r.month : moment(r.month).add(2, 'days').format('YYYY-MM');
        if (!isGoodMonth(month)) return acc;
        if (!isGoodWorkerId(r.workerID) && !r.workerID) return acc;

        let monthData = acc.monthByName[month];
        if (!monthData) {
            acc.monthByName[month] = {
                total: 0,
            };
            acc.monthes.push(month);
        }
        let cats = acc.byWorkerByMonth[r.workerID];
        if (!cats) {
            cats = {};
            acc.byWorkerByMonth[r.workerID] = cats;
            acc.workerIDs.push(r.workerID);
        }
        
        let catMonth = cats[month];
        if (!catMonth) {
            catMonth = {
                workerID: r.workerID,
                month,
                totalAmountWokerMonth: 0,
                records: [],
            }
            cats[month] = catMonth;
        }
        catMonth.totalAmountWokerMonth += r.amount;

        catMonth.records.push(r);
        acc.workerTotals[r.workerID] = (acc.workerTotals[r.workerID] || 0) + r.amount;
        acc.monthlyTotal[month] = (acc.monthlyTotal[month] || 0) + r.amount;

        acc.total += r.amount;
        return acc;
    }, {
        monthByName: {},
        monthes: [],
        workerIDs: [],
        workerTotals: {},
        byWorkerByMonth: {},
        monthlyTotal: {},
        total: 0,
    } as IMaintenanceDataByWorkerMonthRes);

    const sortLowOthers = (cats: string[]) => {
        const others = 'Others';
        const res = cats.filter(k => k !== others);
        res.sort();
        if (cats.filter(k => k === others).length) {
            res.push(others);
        }
        return res;
    }

    maintenceData.workerIDs = sortLowOthers(maintenceData.workerIDs);    
    return maintenceData;
}