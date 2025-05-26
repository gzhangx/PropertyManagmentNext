import { IMainSideBarSection } from './page/sidebar'
import { HouseList } from './page/inputs/houseList'


import YearlyMaintenanceReport from '../app/pages/reports/yearlyMaintenanceReport';
import RentReport from '../app/pages/reports/rentReport';
import CashFlowRpt from '../app/pages/reports/cashFlowReport';
import { getLeasePage } from '../app/pages/reports/autoAssignLeases'
import { RenterEmailConfig } from '../app/pages/config/renterEmailConfig'
import EstimatedTaxReport from '../app/pages/reports/taxReport';

import * as dev2 from '../app/pages/util/dev2'

import type { CSSProperties, JSX } from "react";
import { TableNames } from './types'

import GoogleSheetConfigPage from '../app/pages/config/googleSheetConfig'

import NewLeaseReport from '../app/pages/reports/leaseReport'

import Register from '../app/pages/register'
import ForgetPassword from '../app/pages/forget';

type LocalPageInfo = {
    name: string;
    page?: JSX.Element;
    table?: TableNames;
    pageOuterStyles?: CSSProperties;
}


const inputPages: LocalPageInfo[] = [
    {
        name: 'House Info',
        page: <HouseList />,
        table: 'houseInfo',
    },
    {
        name: 'Payments',
        //page: <RentpaymentInfo />,
        table: 'rentPaymentInfo',  //don't specify table, it will be generated in dashboard.tsx
    },
    {
        name: 'MaintenanceRecords',
        //page: <MaintenanceRecords />,
        table: 'maintenanceRecords',
    },
    {
        name: 'Tenants',
        //page: <TenantList />,
        table: 'tenantInfo',
    },
    {
        name: 'Leases',
        table: 'leaseInfo',
        //page: LeaseList(),
        //table: 'leaseInfo',
    },
    {
        name: 'Owners',
        //page: <OwnerList />,
        table: 'ownerInfo'
    }, {
        name: 'Workers',
        table: 'workerInfo'        
    },  
    {
        name: 'AutoAssignLeases',
        page: getLeasePage(),        
    }, 
   
];

const allSections: {
    name: string;
    pages: LocalPageInfo[];    
}[] = [
    {
        name: ' PM Reports',
        pages: [            
            {
                name: 'Cash Flow Report',
                page: <CashFlowRpt />,
            },
            {
                name: 'Rent Report',
                page: <RentReport />,
            },            
            {
                name: 'Lease Report',
                page: <NewLeaseReport />,
            },
            {
                name: 'Yearly 1099 Report',
                page: <YearlyMaintenanceReport />,                
            },
            {
                name: 'Tax Estimate (test)',
                page: <EstimatedTaxReport/>
            },
        ]
    },
    {
        name: 'PM Inputs',
        pages: inputPages,
    },
    {
        name: 'Config',
        pages: [
            {
                name: 'Google Sheet Config',
                page: <GoogleSheetConfigPage />,
            },
            {
                name: 'Renter Email Config',
                page: <RenterEmailConfig></RenterEmailConfig>,
                pageOuterStyles: {},
                
            },
            {
                name: 'ExpenseCategories',
                table: 'expenseCategories',
            }
        ]
    }, {
        name: 'Google Imports',
        pages: [
            {
                name: 'Google Sheet Imports 2',
                page: <dev2.DevelopPage />,
            },
        ]
    }
]


const { sections, sideBarContentLookup } = allSections.reduce((acc, sec) => {
    const name = sec.name;
    const getPgName = (p: {name: string}) => `${name}:${p.name}`.replace(/ /g, '');
    const section = {
        name,
        displayName: name,
        pages: sec.pages.map(p => ({ name: getPgName(p), displayName: p.name })),
    }
    acc.sectionsByName[name] = section;
    acc.sections.push(section);
    acc.sideBarContentLookup = sec.pages.reduce((acc, p) => {
        const pname = getPgName(p);
        acc.set(pname, p);
        //acc[pname] = p;
        return acc;
    }, acc.sideBarContentLookup);
    return acc;
}, {
    sections: [] as IMainSideBarSection[],
    sideBarContentLookup: new Map<string, LocalPageInfo>(),
    sectionsByName: {} as {[name:string]:IMainSideBarSection},
});

sideBarContentLookup.set('register', { name: 'register',  page: <Register/> });
sideBarContentLookup.set('forget-password', { name: 'forget', page: <ForgetPassword/> });

const otherPages = <></>
export {
    sections,
    sideBarContentLookup,
    otherPages,
};