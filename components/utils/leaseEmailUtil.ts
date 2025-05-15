import moment from 'moment';
import { getUserOptions } from '../api'
import { IHouseInfo, ILeaseInfo, IPageRelatedState, ITenantInfo } from '../reportTypes';
import { gatherLeaseInfomation, HouseWithLease, ILeaseInfoWithPmtInfo } from './leaseUtil';
import { IStringLogger } from '../types';


export const paymentEmailSubject = 'paymentEmailSubject';
export const paymentEmailText = 'paymentEmailText';
export const googleSmtpUser = 'googleSmtpUser';
export const googleSmtpPass = 'googleSmtpPass';
export async function getPaymentEmailConfig() {
    return getUserOptions([]).then(res => {
        const subject = res.find(r => r.id === paymentEmailSubject)?.data || '';
        const text = res.find(r => r.id === paymentEmailText)?.data || '';

        const user = res.find(r => r.id === googleSmtpUser)?.data || '';
        const pass = res.find(r => r.id === googleSmtpPass)?.data || '';
        return {
            subject,
            text,
            user,
            pass
        }
    })
}






const START = '$';
const MATCHCHAR = '{';
const ENDMATCHCHAR = '}'
const verbs = [
    '$LoopMonthly{',
    '$PaymentMonth{',
    '$PaymentDate{',
    '$DueDate{',
    '$Paid',
    '$Balance',
    '$PreviousBalance',
    '$Renters',
    '$CurrentBalance',
    '$Date{',
    '$LastPaymentDate{',
    '$LastPaymentAmount',
] as const;
type TagNames = typeof verbs[number];
type TAG = {
    tag: TagNames;
    parts: (string | TAG)[];
}
function parser(s: string, pos: number, level: number) {
    const parts: (string | TAG)[] = [];

    
    let curBuffer = '';
    let inSTART = false;
    let lastChar = '';
    for (; pos < s.length; pos++) {
        const v = s[pos];
        if (lastChar === '\\') {
            if (v === '{' || v === '}') {
                lastChar = '';
                curBuffer += v;
                continue;
            }
            curBuffer += lastChar;
            lastChar = '';
        }
        if (v === '\\') {
            lastChar = v;
            continue;
        }
        if (v === START) {
            inSTART = true;
            parts.push(curBuffer);
            curBuffer = v;
        } else if (inSTART) {
            curBuffer += v;
            const who = verbs.indexOf(curBuffer as TagNames);
            if (who >= 0) {
                const tag: TAG = {
                    tag: curBuffer as TagNames,
                    parts: [],
                }
                curBuffer = '';
                inSTART = false;
                parts.push(tag);
                if (tag.tag.endsWith(MATCHCHAR)) {
                    const prt = parser(s, pos + 1, level + 1);
                    tag.parts = prt.parts;
                    pos = prt.pos;
                }
            }
        } else if (v === ENDMATCHCHAR && level !== 0) { //if level is 0, that is a bad match
            parts.push(curBuffer);
            break;
        } else {
            curBuffer += v;
        }
        lastChar = v;
    }
    if (curBuffer) {
        parts.push(curBuffer);
    }
    return {
        parts,
        pos,
    }
}


function doReplace(text: string, house: HouseWithLease, tenants: ITenantInfo[],  logger: IStringLogger) {
    const tags = parser(text, 0, 0);
    const monthlyInfo = house.leaseInfo.monthlyInfo;
    const output: string = tags.parts.reduce((acc: string, tag: TAG) => {
        if (typeof tag === 'string') {
            return acc + tag;
        } else {
            switch (tag.tag) {
                case '$LoopMonthly{':
                    if (!tag.parts.length) {
                        logger(`Warning, ${tag.tag} expecting contents`);                        
                    } else {
                        const p0 = tag.parts[0];
                        if (typeof p0 !== 'string') {
                            logger(`Warning, ${tag.tag} expecting number, as first parameter`);
                        } else {
                            const matched = p0.match(/(\d+)[ ]*,(.*)/);
                            if (!matched) {
                                logger(`Warning, ${tag.tag} expecting number, as first parameter`);
                            } else {
                                const loops = parseInt(matched[1]);
                                acc += matched[2];                                
                                for (let i = 0; i < loops; i++) {
                                    const curMonthlyInfo = monthlyInfo[i];
                                    if (!curMonthlyInfo) break;
                                    acc += matched[2];
                                    for (let pi = 1; pi < tag.parts.length; pi++) {
                                        const ptg = tag.parts[pi]; 
                                        if (typeof ptg === 'string') {
                                            acc += ptg;
                                        } else {
                                            switch (ptg.tag) {
                                                case '$PreviousBalance':
                                                    acc += '$' + curMonthlyInfo.previousBalance.toFixed(2);
                                                    break;
                                                case '$Balance':
                                                    acc += '$'+curMonthlyInfo.balance.toFixed(2);
                                                    break;
                                                case '$Paid':
                                                    acc += '$' + curMonthlyInfo.paid.toFixed(2);
                                                    break;
                                                case '$PaymentMonth{':
                                                    if (ptg.parts.length && typeof ptg.parts[0] === 'string') {
                                                        acc += moment(curMonthlyInfo.month + '-01').format(ptg.parts[0]);
                                                    } else {
                                                        logger(`Warning, ${ptg.tag} no format specified`)
                                                        acc += curMonthlyInfo.month;
                                                    }
                                                    break;
                                                case '$PaymentDate{':
                                                    if (ptg.parts.length && typeof ptg.parts[0] === 'string') {
                                                        acc += curMonthlyInfo.paymentDate ? moment(curMonthlyInfo.paymentDate).format(ptg.parts[0]) : '';
                                                    } else {
                                                        logger(`Warning, ${ptg.tag} no format specified`)
                                                        acc += curMonthlyInfo.paymentDate;
                                                    }
                                                    break;
                                                case '$DueDate{':
                                                    if (ptg.parts.length && typeof ptg.parts[0] === 'string') {
                                                        acc += curMonthlyInfo.dueDate ? moment(curMonthlyInfo.dueDate).format(ptg.parts[0]) : '';
                                                    } else {
                                                        logger(`Warning, ${ptg.tag} no format specified`)
                                                        acc += curMonthlyInfo.dueDate;
                                                    }
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    break;
                case '$Date{':
                    if (typeof tag.parts[0] === 'string') {
                        acc += moment().format(tag.parts[0]);
                    } else {
                        logger(`Warning, ${tag.tag} has no formatting`);
                        acc += new Date().toISOString();
                    }                    
                    break;
                case '$CurrentBalance':
                    {
                        const amt = monthlyInfo[0]?.balance?.toFixed(2);
                        acc += amt ? '$' + amt : '';
                    }
                    break;
                case '$Renters':
                    acc += tenants.map(t => t.fullName).join(',');
                    break;
                case '$LastPaymentDate{':
                    if (typeof tag.parts[0] === 'string') {
                        acc += moment(house.leaseInfo.lastPaymentDate).format(tag.parts[0]);
                    } else {
                        acc += moment(house.leaseInfo.lastPaymentDate).format('YYYY-MM-DD');
                    }
                    break;
                case '$LastPaymentAmount':
                    {
                        const lamt = house.leaseInfo.lastPaymentAmount;
                        acc += lamt ? '$' + lamt : '';
                    }
                    break;
            }
        }
        return acc;
    }, '') as string;
    
    return output;
}

export async function getTenantsForHouse(mainCtx: IPageRelatedState, house: HouseWithLease) {
    const mailToIds = [];
    for (let i = 1; i <= 5; i++) {
        const id = house.lease?.['tenant' + i];
        if (id) mailToIds.push(id);
    }
    const tenantMaps = mainCtx.foreignKeyLoopkup.get('tenantInfo');
    const tenants = mailToIds.map(id => (tenantMaps.idDesc.get(id) as unknown as ITenantInfo)).filter(x=>x);
    return tenants;
}
export async function formateEmail(mainCtx: IPageRelatedState, house: HouseWithLease, logger: IStringLogger) {
    const template = await getPaymentEmailConfig();

    await mainCtx.loadForeignKeyLookup('tenantInfo');

    if (!house.lease) {
        await gatherLeaseInfomation(house);
    }
    if (!house.lease || !house.leaseInfo) {
        return {
            subject: 'no lease found',
            body: 'no lease found',
            mailtos: [],
        }
    }
    let last2 = '';
    for (let i = 0; i < 2; i++) {
        const inf = house.leaseInfo?.monthlyInfo[i];
        if (!inf) break;
        last2 += `${inf.month}  Balance ${inf.balance}  Paid: ${inf.paid}\n`
    }
    // const mailToIds = [];
    // for (let i = 1; i <= 5; i++) {
    //     const id = house.lease['tenant' + i];
    //     if (id) mailToIds.push(id);
    // }
    const tenants = await getTenantsForHouse(mainCtx, house);
    //const tenantMaps = mainCtx.foreignKeyLoopkup.get('tenantInfo');
    //const mailtos = mailToIds.map(id => (tenantMaps.idDesc.get(id) as any)?.email || `UnableToGetName${id}`).join(';');
    const mailtos = tenants.map(t => t.email);

    const subject = (doReplace(template.subject, house, tenants,logger));
    const body = (doReplace(template.text, house, tenants,logger));
    
    return {
        subject, 
        body,
        mailtos,
    }
}