import moment from 'moment';
import { getUserOptions } from '../api'
import { IHouseInfo, ILeaseInfo, IPageRelatedState } from '../reportTypes';
import { ILeaseInfoWithPmtInfo } from './leaseUtil';


export const paymentEmailSubject = 'paymentEmailSubject';
export const paymentEmailText = 'paymentEmailText';
export async function getPaymentEmailConfig() {
    return getUserOptions([]).then(res => {
        const subject = res.find(r => r.id === paymentEmailSubject)?.data || '';
        const text = res.find(r => r.id === paymentEmailText)?.data || '';
        return {
            subject,
            text,
        }
    })
}


export type HouseWithLease = IHouseInfo & {
    lease?: ILeaseInfo;
    leaseInfo?: ILeaseInfoWithPmtInfo;
}


function doReplace(text: string, house: HouseWithLease) {
    function doDate(inp: string, ary: RegExpMatchArray | null, date: moment.Moment) {
        if (ary === null) return inp;
        //0 is original str, 1 is what's inside date, 2 is the rest of string, index is where to cut to get first part
        return inp.substring(0, ary.index) + moment().format(ary[1]) + ary[2];
    }
    function doDirectReplace(inp: string, reg: RegExp, replaceBy: string) {
        while (true) {
            const mc = inp.match(reg);
            if (!mc) break;
            inp = inp.substring(0, mc.index) + replaceBy + mc[1];
        }
        return inp;
    }
    const matches: {
        action: (inp: string) => string,
    }[] = [
            {
                action: (inp) => {
                    const ary = inp.match(/\$DATE\((.+)\)(.*)/);
                    while (true) {
                        const res = doDate(inp, ary, moment());
                        if (res === inp) return res;
                        inp = res;
                    }
                },
            },
            {
                action: (inp) => {
                    const ary = inp.match(/\$LOOPMONTHLY\((\d+)[ \t]*,(.+)\)(.*)/);
                    if (ary === null) return inp;
                    //0 origina, 1 is number of repeats, 2 content, 3 rest index: start
                    const pre = inp.substring(0, ary.index);
                    const content = ary[2];
                    const post = ary[3];
                    const nums = parseInt(ary[1]);
                    const lines: string[] = [];
                    for (let i = 0; i < nums; i++) {                        
                        const m = house.leaseInfo.monthlyInfo[i];                        
                        if (!m) break;
                        let thisContent = content;
                        while (true) {
                            const mc = thisContent.match(/\$PDATE\((.+)\)(.+)/)
                            if (!mc) break;
                            thisContent = doDate(thisContent, mc, moment(m.month+'-01'));
                        }
                        thisContent = doDirectReplace(thisContent, /\$PAID(.+)/, '$' + m.paid.toFixed(2));
                        thisContent = doDirectReplace(thisContent, /\$BALANCE(.+)/, '$' + m.balance.toFixed(2));
                        lines.push(thisContent);
                    }
                    return pre + lines.join('\n') + post;
                }
            }
        ];
    for (const m of matches) {
        text = text.split('\n').map(t => {
            return m.action(t);
        }).join('\n')        
    }
    return text;
}
export async function formateEmail(mainCtx: IPageRelatedState, house: HouseWithLease) {
    const template = await getPaymentEmailConfig();

    await mainCtx.loadForeignKeyLookup('tenantInfo');

    let last2 = '';
    for (let i = 0; i < 2; i++) {
        const inf = house.leaseInfo.monthlyInfo[i];
        if (!inf) break;
        last2 += `${inf.month}  Balance ${inf.balance}  Paid: ${inf.paid}\n`
    }
    const mailToIds = [];
    for (let i = 1; i <= 5; i++) {
        const id = house.lease['tenant' + i];
        if (id) mailToIds.push(id);
    }
    const tenantMaps = mainCtx.foreignKeyLoopkup.get('tenantInfo');
    const mailtos = mailToIds.map(id => (tenantMaps.idDesc.get(id) as any)?.email || `UnableToGetName${id}`).join(';');

    const subject = encodeURIComponent(doReplace(template.subject, house));
    const body = encodeURIComponent(doReplace(template.text, house));
    
    return {
        subject, 
        body,
        mailtos,
    }
}