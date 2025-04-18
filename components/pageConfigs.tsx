import { IMainSideBarSection } from './page/sidebar'
import { HouseList } from './page/inputs/houseList'
import { RentpaymentInfo } from './page/inputs/rentpaymentInfo'
import { OwnerList } from './page/inputs/ownerList'

import { TenantList } from './page/inputs/tenantList'
import { LeaseList } from './page/inputs/leaseList'


import YearlyMaintenanceReport from '../pages/reports/yearlyMaintenanceReport';
import RentReport from '../pages/reports/rentReport';
import CashFlowRpt from '../pages/reports/cashFlowReport';
import { getLeasePage } from '../pages/reports/autoAssignLeases'
import { RenterEmailConfig } from './page/inputs/renterEmailConfig'

import * as dev2 from '../pages/util/dev2'

import type { JSX } from "react";
import { TableNames } from './types'

import GoogleSheetConfigPage from '../pages/config/googleSheetConfig'

import {LeaseReport as NewLeaseReport} from '../pages/reports/leaseReport'

type LocalPageInfo = {
    name: string;
    page?: JSX.Element;
    table?: TableNames;
}


const inputPages: LocalPageInfo[] = [
    {
        name: 'House Info',
        page: <HouseList />,
        table: 'houseInfo',
    },
    {
        name: 'Payments',
        page: <RentpaymentInfo />,
        //table: 'rentPaymentInfo',  don't specify table, it will be generated in dashboard.tsx
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
        page: LeaseList(),
        //table: 'leaseInfo',
    },
    {
        name: 'Owners',
        //page: <OwnerList />,
        table: 'ownerInfo'
    }, {
        name: 'AutoAssignLeases',
        page: getLeasePage(),        
    }, 
];

const allSections = [
    {
        name: 'PM Reports',
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
                page: <YearlyMaintenanceReport/>,
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
                page: <RenterEmailConfig></RenterEmailConfig>
            }
        ]
    }, {
        name: 'Google Imports',
        pages: [
            {
                name: 'Google Sheet Imports 2',
                page: <dev2.DevelopPage />,
                selected: true,
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
        pages: sec.pages.map(p => ({ name: getPgName(p), displayName: p.name, selected: p.selected })),
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


const otherPages = <></>
export {
    sections,
    sideBarContentLookup,
    otherPages,
};