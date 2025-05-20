import moment from 'moment';
import { getUserOptions } from '../api'
import { IHouseInfo, ILeaseInfo, IPageRelatedState, ITenantInfo } from '../reportTypes';
import { gatherLeaseInfomation, HouseWithLease, ILeaseInfoWithPaymentDueHistory, ILeaseInfoWithPmtInfo, INewLeaseBalance } from './leaseUtil';
import { IStringLogger } from '../types';
import { formatAccounting } from './reportUtils';
import { renderRenderBalanceEmailBodyToText } from './DirectEmailBodyContent';
import { startCase } from 'lodash';


export const paymentEmailSubject = 'paymentEmailSubject';
export const paymentEmailText = 'paymentEmailText';

export const paymentEmailContactPhone = 'paymentEmailContactPhone';
export const paymentEmailContactEmail = 'paymentEmailContactEmail';
export const paymentEmailSenderName = 'paymentEmailSenderName';

export const googleSmtpUser = 'googleSmtpUser';
export const googleSmtpPass = 'googleSmtpPass';

export const paymentEmailProps = [
    paymentEmailSubject,
    paymentEmailText,
    paymentEmailContactPhone,
    paymentEmailContactEmail,
    paymentEmailSenderName,
    googleSmtpUser,
    googleSmtpPass,
] as const;

export function getPaymentEmailDesc(name: typeof paymentEmailProps[number]) {
    return startCase(name);
}

export type IPaymentEmailConfig = Record<typeof paymentEmailProps[number], string>;
export async function getPaymentEmailConfig(): Promise<IPaymentEmailConfig> {
    return getUserOptions([]).then(res => {
        const retObj: IPaymentEmailConfig = {} as IPaymentEmailConfig;
        paymentEmailProps.forEach(name => {
            retObj[name] = res.find(r => r.id === name)?.data || '';
        })        
        return retObj;
    })
}





const verbs = [
    'LoopMonthly',
    //'$PaymentMonth{',
    //'$PaymentDate{',    
    'Type',
    'Amount',
    'RentDue',    
    'Balance',
    'PreviousBalance',
    'Renters',
    'CurrentBalance',
    'BalanceForwarded',
    'Date',
    'LastPaymentDate',
    'LastPaymentAmount',
    'Today',
] as const;
type TagNames = typeof verbs[number];


interface IParsedTag {
    type: 'text' | 'tag';
    name: string;
    children: IParsedTag[];
    text: string;
}
function parseTaggedString(input: string) {

    const result: IParsedTag[] = [];
    let i = 0;

    const isEOF = () => i >= input.length;
    const peek = () => (isEOF() ? '' : input[i]);
    const consume = () => input[i++];

    function parse() {
        const nodes: IParsedTag[] = [];
        while (!isEOF()) {
            if (peek() === '$' && i + 1 < input.length && /[a-zA-Z0-9]/.test(input[i + 1])) {
                const tag = parseTag();
                if (tag) nodes.push(tag);
            } else {
                const text = parseText();
                if (text) nodes.push({
                    type: 'text',
                    name: '',
                    children: [],
                    text,
                });
            }
        }
        return nodes;
    }

    function parseTag(): IParsedTag {
        if (peek() !== '$') return null;
        consume(); // Skip $

        let name = '';
        while (/[a-zA-Z0-9]/.test(peek()) && !isEOF()) {
            name += consume();
        }

        if (!name) return null;

        let children: IParsedTag[] = [];
        let text = '';

        if (peek() === '{') {
            consume(); // Skip {
            const content = parseBracedContent();
            if (content !== null) {
                // Store the original position
                const originalInput = input;
                const originalIndex = i;

                // Parse the content as a new input
                input = content;
                i = 0;
                children = parse();

                // Restore original state
                input = originalInput;
                i = originalIndex;

                // If we have simple text content, store it in data
                if (children.length === 1 && typeof children[0] === 'string') {
                    text = children[0];
                    children = [];
                }
            }
            if (peek() === '}') {
                consume(); // Skip }
            }
        }

        return {
            type: 'tag',
            name, children, text
        };
    }

    function parseText() {
        let text = '';
        while (!isEOF()) {
            const char = peek();
            if (char === '\\') {
                consume(); // Skip escape character
                if (!isEOF()) {
                    // Add the next character literally
                    text += consume();
                }
            } else if (char === '$') {
                // Only treat as tag start if followed by valid tag name character
                if (i + 1 < input.length && /[a-zA-Z0-9]/.test(input[i + 1])) {
                    break;
                }
                text += consume();
            } else {
                text += consume();
            }
        }
        return text;
    }

    function parseBracedContent() {
        let content = '';
        let braceCount = 1; // Start at 1 because we already consumed the opening {

        while (!isEOF()) {
            const char = peek();
            if (char === '\\') {
                consume(); // Skip escape character
                if (!isEOF()) {
                    content += consume();
                }
            } else if (char === '{') {
                braceCount++;
                content += consume();
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    // Don't consume the closing brace - let the parent do that
                    break;
                }
                content += consume();
            } else {
                content += consume();
            }
        }

        return braceCount === 0 ? content : null;
    }

    return parse();
}

type IMainContext = {
    house: HouseWithLease;
    tenants: ITenantInfo[];
}
function doReplaceOnContext(logger: IStringLogger, tags: IParsedTag[], mainContext: IMainContext, curPaymentDueInfo?: INewLeaseBalance) {    
    const output: string = tags.reduce((acc: string, tag) => {
        if (tag.type === 'text') {
            return acc + tag.text;
        } else {
            switch (tag.name as TagNames) {
                case 'LoopMonthly': //context name, repeat count
                    if (!tag.children.length) {
                        logger(`Warning, ${tag.name} expecting contents`);
                    } else {                                                
                        //const loops = parseInt(matched.groups.loop);                                
                        //const lastn = mainContext.house.leaseBalanceDueInfo.getLastNMonth(loops);
                        const lastn = mainContext.house.leaseBalanceDueInfo.lastNPaymentAndDue;
                        const children = [...tag.children];
                        //children[0] = { ...children[0] };
                        //children[0].text = matched.groups.text;
                        for (const curMonthlyInfo of lastn) {
                            acc += doReplaceOnContext(logger, children, mainContext, curMonthlyInfo);
                        }
                    }
                    break;
                
                /// loop related
                case 'PreviousBalance':
                    acc += formatAccounting(curPaymentDueInfo?.previousBalance);
                    break;
                case 'Balance':
                    acc += formatAccounting(curPaymentDueInfo?.newBalance);
                    break;
                case 'Amount':
                    let amt = curPaymentDueInfo?.paymentOrDueAmount;
                    if (curPaymentDueInfo.paymentOrDueTransactionType === 'Payment') {
                        amt = -amt;
                    }
                    acc += formatAccounting(amt);
                    break;
                case 'Date':
                    if (tag.children.length && typeof tag.children[0] === 'string') {
                        acc += moment(curPaymentDueInfo?.date).format(tag.children[0]);
                    } else {
                        logger(`Warning, ${tag.name} no format specified`)
                        acc += curPaymentDueInfo?.date;
                    }
                    break;
                case 'Type':
                    acc += curPaymentDueInfo?.paymentOrDueTransactionType;
                    break;
                case 'RentDue':
                    acc += formatAccounting(mainContext.house.leaseInfo.monthlyRent);
                    break;
                /// end loop related
                case 'Today':
                    if (typeof tag.children[0] === 'string') {
                        acc += moment().format(tag.children[0]);
                    } else {
                        logger(`Warning, ${tag.name} has no formatting`);
                        acc += new Date().toISOString();
                    }
                    break;
                case 'CurrentBalance':
                    {
                        const amt = mainContext.house.leaseBalanceDueInfo.totalBalance?.toFixed(2);
                        acc += amt ? formatAccounting(amt) : '';
                    }
                    break;
                case 'Renters':
                    acc += mainContext.tenants.map(t => t.firstName).join(' and ');
                    break;
                case 'LastPaymentDate':
                    if (typeof tag.children[0] === 'string') {
                        acc += moment(mainContext.house.leaseInfo.lastPaymentDate).format(tag.children[0]);
                    } else {
                        acc += moment(mainContext.house.leaseInfo.lastPaymentDate).format('YYYY-MM-DD');
                    }
                    break;
                case 'LastPaymentAmount':
                    {
                        const lamt = mainContext.house.leaseInfo.lastPaymentAmount;
                        acc += lamt ? formatAccounting(lamt) : '';
                    }
                    break;
                case 'BalanceForwarded':
                    acc += formatAccounting(mainContext.house.leaseBalanceDueInfo.balanceForwarded);
                    break;
            }
        }
        return acc;
    }, '') as string;
    return output;
}
function doReplace(text: string, house: HouseWithLease, tenants: ITenantInfo[],  logger: IStringLogger) {
    const tags = parseTaggedString(text);

    const output = doReplaceOnContext(logger, tags, {
        house, tenants,
    });
    
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
    if (!house.lease || !house.leaseInfo || !house.leaseBalanceDueInfo) {
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

    const subject = (doReplace(template.paymentEmailSubject, house, tenants, logger));
    const rentEmailConfig = await getPaymentEmailConfig();
    //const body = (doReplace(template.text, house, tenants,logger));
    const body = renderRenderBalanceEmailBodyToText({
        house,
        tenants,
        contactEmail: rentEmailConfig.paymentEmailContactEmail,
        contactPhone: rentEmailConfig.paymentEmailContactPhone,
    })
    
    return {
        subject, 
        body,
        mailtos,
    }
}