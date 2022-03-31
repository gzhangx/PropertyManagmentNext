import { OwnerList } from '../components/page/reports/ownerList'
import { CashFlowReport } from '../components/page/reports/cashflow'
import { DevelopPage } from './util/dev'
import { IMainSideBarSection } from '../components/page/sidebar'

const allSections = [
    {
        name: 'PM Reports',
        pages: [
            {
                name: 'Cash Flow',
                page: <CashFlowReport />,
            },
            {
                name: 'Develop',
                page: <DevelopPage/>,
            }
        ]
    },
    {
        name: 'PM Inputs',
        pages: [
            {
                name: 'Owner Info',
                page: <OwnerList />,
            }
        ]
    },
]


const { sections, sideBarContentLookup } = allSections.reduce((acc, sec) => {
    const name = sec.name;        
    const section = {
        name,
        displayName: name,
        pages: sec.pages.map(p => ({ name: `${name}:${p.name}`, displayName: p.name })),
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