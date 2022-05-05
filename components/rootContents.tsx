import { IMainSideBarSection } from './page/sidebar'
import { OwnerList } from '../components/page/reports/ownerList'
import { HouseList } from '../components/page/reports/houseList'
import { RentpaymentInfo } from '../components/page/reports/rentpaymentInfo'
import { CashFlowReport } from '../components/page/reports/cashflow'
import { DevelopPage } from '../pages/util/dev'
import * as dev2 from '../pages/util/dev'
import GoogleAuth from '../pages/google/googleAuth'

import { LeaseReport } from './page/reports/lease'
import MonthlyComp from '../pages/reports/MonthlyComp'

const allSections = [
    {
        name: 'PM Reports',
        pages: [
            {
                name: 'Cash Flow',
                page: <CashFlowReport />,
            },
            {
                name: 'Lease Report',
                page: <LeaseReport/>,
            },
            {
                name: 'Comp Report',
                page: <MonthlyComp/>,
            },
            {
                name: 'Develop',
                page: <DevelopPage />,
                selected: true,
            },
            {
                name: 'Develop 2',
                page: <dev2.DevelopPage />,
                selected: true,
            },
            {
                name: 'GoogleAuth',
                page: <GoogleAuth></GoogleAuth>,
            },
        ]
    },
    {
        name: 'PM Inputs',
        pages: [
            {
                name: 'Owner Info',
                page: <OwnerList />,
            },
            {
                name: 'House Info',
                page: <HouseList />,
            },
            {
                name: 'Payments',
                page: <RentpaymentInfo/>,
            },
        ]
    },
]


const { sections, sideBarContentLookup } = allSections.reduce((acc, sec) => {
    const name = sec.name;        
    const section = {
        name,
        displayName: name,
        pages: sec.pages.map(p => ({ name: `${name}:${p.name}`, displayName: p.name, selected: p.selected })),
    }
    acc.sectionsByName[name] = section;
    acc.sections.push(section);
    acc.sideBarContentLookup = sec.pages.reduce((acc, p) => {
        const pname = `${name}:${p.name}`;
        acc[pname] = p.page;
        return acc;
    }, acc.sideBarContentLookup);
    return acc;
}, {
    sections: [] as IMainSideBarSection[],
    sideBarContentLookup: {} as { [name: string]: JSX.Element },
    sectionsByName: {} as {[name:string]:IMainSideBarSection},
});

export {
    sections,
    sideBarContentLookup,
};