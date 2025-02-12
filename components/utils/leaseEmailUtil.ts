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

    const subject = encodeURIComponent(`Payment received for ${house.address}`);
    const body = encodeURIComponent(`
Dear tenant,
Thank you for your payment, Below is your summary
${last2}`);
    
    return {
        subject, 
        body,
        mailtos,
    }
}