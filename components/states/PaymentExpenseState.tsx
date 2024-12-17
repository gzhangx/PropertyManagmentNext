import React, { useState, useEffect, useContext } from 'react';
import moment from 'moment';
import { orderBy, sortBy, pick, uniqBy, uniq } from 'lodash';
import { getMaintenanceReport, getPaymnents, getHouseAnchorInfo, getSheetAuthInfo, IGoogleSheetAuthInfo } from '../api';

import { IPagePropsByTable } from '../types'
import { IEditTextDropdownItem } from '../generic/EditTextDropdown'
import { useRouter } from 'next/router'

import {
    IPayment, IIncomeExpensesContextValue,
    IHouseInfo,
    //IPageProps,
    IExpenseData,
    IHouseAnchorInfo,
    IStringBoolMap,
} from '../reportTypes';
import { useRootPageContext } from './RootState';

export const TOTALCOLNAME = 'coltotal';
export const fMoneyformat = (amt:number)=> {
    if (!amt) return '-';
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      
        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
    });
    return formatter.format(amt);
};

const getInitExpenseTableData = () => ({
    dateKeys: {}, //temp dedup 
    monthes: [],
    monthlyTotal: {},
    categoriesByKey: {
        [TOTALCOLNAME]: { 
            total: 0,
        }
    },
    categoryNames: [],
});

export const IncomeExpensesContext = React.createContext({} as IIncomeExpensesContextValue);

export function useIncomeExpensesContext() {
    return useContext(IncomeExpensesContext);
}
export function PaymentExpenseStateWrapper(props: {
    children: any
}) {
    const rootCtx = useRootPageContext();
    const [loginError, setLoginError] = useState<string>('');
    const [pageProps, setPageProps] = useState<IPagePropsByTable>({
        pagePropsTableInfo: {},
        reloadCount: 0,
    } as IPagePropsByTable);    
    const [rawExpenseData, setRawExpenseData] = useState([] as IExpenseData[]);
    const [payments, setPayments] = useState<IPayment[]>([]);
    
    const [allMonthes, setAllMonths] = useState<string[]>([]);
    const [allHouses, setAllHouses] = useState<IHouseInfo[]>([]); //{houseID, address}
    const [googleSheetAuthInfo, setGoogleSheetAuthinfo] = useState<IGoogleSheetAuthInfo>({
        client_email: 'NA',
        googleSheetId: '',
        private_key: '',
        private_key_id: '',
    } );

    const [houseAnchorInfo, setHouseAnchorInfo] = useState<IHouseAnchorInfo[]>([]);

    //month selection states
    const [monthes, setMonthesOrig] = useState<string[]>([]);
    const setMonthes = (mon: string[]) => {        
        setMonthesOrig(orderBy(mon, x=>x, 'desc'));  
    };
    const [curMonthSelection, setCurMonthSelection] = useState<IEditTextDropdownItem>({ label: '', value: '' });    
    const [selectedMonths, setSelectedMonths] = useState<IStringBoolMap>({});
    const [selectedHouses, setSelectedHouses] = useState<IStringBoolMap>({});

    const router = useRouter();

    function addMonths(mons: string[]) {
        setAllMonths(orig => {
            const r = orig.concat(mons).reduce((acc, m) => {
                if (!acc.dict[m]) {
                    acc.dict[m] = true;
                    acc.res.push(m);
                }
                return acc;
            }, {
                dict: {} as {[mon:string]:boolean},
                res: [] as string[],
            }).res;
            r.sort();
            return r;
        });
    }

    function addHouses(housesAll: IHouseInfo[]) {
        const houses = uniqBy(housesAll.map(h => pick(h, ['houseID', 'address'])), 'houseID').filter(h => h.address);
        setAllHouses(orig => {
            const r = orig.concat(houses).reduce((acc, m) => {
                if (!acc.dict[m.houseID]) {
                    acc.dict[m.houseID] = true;
                    acc.res.push(m);
                }
                return acc;
            }, {
                dict: {} as {[hid:string]: boolean},
                res: [] as IHouseInfo[],
            }).res;            
            return sortBy(r,['address']);
        });
    }

    useEffect(() => {
        getSheetAuthInfo().then(auth => {
            setGoogleSheetAuthinfo(auth);
        })
    }, [googleSheetAuthInfo.googleSheetId]);
    useEffect(() => {
        setMonthes(allMonthes);

    }, [allMonthes]);
        
    //format data
    useEffect(() => {
        setMonthes(allMonthes.filter(m => selectedMonths[m]));
        
    }, [rawExpenseData, payments, curMonthSelection, selectedMonths]);

    useEffect(() => {
        allMonthes.forEach(m => selectedMonths[m] = false);
        let lm: string;
        switch (curMonthSelection.value) {
            case 'LastMonth':
                lm = moment().subtract(1, 'month').format('YYYY-MM');
                selectedMonths[lm] = true;
                break;
            case 'Last3Month':
                lm = moment().subtract(3, 'month').format('YYYY-MM');
                allMonthes.forEach(m => {
                    if (m >= lm)
                        selectedMonths[m] = true;
                });
                break;
            case 'Y2D':
                lm = moment().startOf('year').format('YYYY-MM');
                allMonthes.forEach(m => {
                    if (m >= lm)
                        selectedMonths[m] = true;
                });
                break;
            case 'LastYear':
                lm = moment().startOf('year').format('YYYY-MM');
                allMonthes.forEach(m => {
                    if (m < lm)
                        selectedMonths[m] = true;
                });
                break;
            default:
                allMonthes.forEach(m => selectedMonths[m] = true);
                break;
        }
        setSelectedMonths({ ...selectedMonths });
        setSelectedHouses(allHouses.reduce((acc, h) => {
            acc[h.houseID] = true;
            return acc;
        }, {} as {[id:string]:boolean}
        ));
    }, [rawExpenseData, payments,curMonthSelection]);
    


    const beginReLoadPaymentData = () => {
        getHouseAnchorInfo().then(r => {            
            setHouseAnchorInfo(r);
        })
        return getPaymnents().then(r => {
            r = r.map(r => {
                return {
                    ...r,
                    date: moment(r.date).format('YYYY-MM-DD'),
                    month: moment(r.date).format('YYYY-MM'),
                }
            }).sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date < b.date) return -1;
                return 0;
            });
            
            setPayments(r);
            //addMonths(pm.monthNames);
            addMonths(uniq(r.map(r=>r.month)))
            addHouses(r as any); //same sig
        });        
    }

    useEffect(() => {
        getMaintenanceReport().then(d => {
            addMonths(uniq(d.map(r => r.month)));
            addHouses(d as any); //same sig
            setRawExpenseData(d);
        });
        
        beginReLoadPaymentData();
    }, [rootCtx.userInfo.id]);



    const incomExpCtx: IIncomeExpensesContextValue = {
        //pageProps, setPageProps,
        pageState: {
            pageProps,
            setPageProps,
        },
        googleSheetAuthInfo,
        setGoogleSheetAuthinfo,
        loginError,
        setLoginError,
        rawExpenseData,
        payments,
        allMonthes,
        allHouses,
        houseAnchorInfo,
        monthes, setMonthes,
        curMonthSelection, setCurMonthSelection,
        selectedMonths, setSelectedMonths,
        selectedHouses, setSelectedHouses,
        beginReLoadPaymentData,
        paymentCalcOpts: {
            isGoodMonth: m => selectedMonths[m],
            isGoodHouseId: id => selectedHouses[id],
            getHouseShareInfo: () => [...houseAnchorInfo],
            isGoodWorkerId: workerID => true, //DEBUGREMOVE add check
        }
    };
    return <IncomeExpensesContext.Provider value={incomExpCtx}>
        { props.children}
        </IncomeExpensesContext.Provider>;
}