type Form1099Info = {
    otherIncome: string;
    calendarYear: string;
    payer: {
        tin: string;
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        //email: string;
    };
    receipient: {
        tin: string;
        typeOfTin: 'EIN' | 'SSN' | 'ITIN' | 'ATIN' | '';
        name: string;
        street: string;
        city: string
        state: string;
        zip: string;
    };
    
    transmitterInfo: TransmitterInfo;
}


type TransmitterInfo = {
    calendarYear: string;
    tin: string;
    company: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        //phone: string;
        //email: string;
    };
    contact: {
        name: string;
        phone: string;
        email: string;
    };
    vendor: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        phone: string;
        email: string;
    }

    forms: Form1099Info[];
    recordSeq: number;
}

function generateRecordSeq(info: TransmitterInfo) {
    return (info.recordSeq++).toString().padStart(8, '0');
}
type P1220RecordFieldTemplate<T> = {
    title: string;
    position: number;
    positionEnd: number;
    required?: boolean;
    pad?: string;
    padType?: 'start' | 'end';
    value: ((info: T) => string) | string;
}

type P1220RecordTemplate<T> = {
    name: string,
    fields: P1220RecordFieldTemplate<T>[];
}

const TRecord: P1220RecordTemplate<TransmitterInfo> = {
    name: 'TRecord',
    fields: [
        {
            position: 1,
            positionEnd: 1,
            title: 'Record Type',
            value: 'T',
        },
        {
            position: 2,
            positionEnd: 5,
            title: 'Payment Year',
            value: info=>info.calendarYear,
        },
        {
            position: 6,
            positionEnd: 6,
            title: 'Prior Year Data Ind',
            value: ' ',
        },
        {
            position: 7,
            positionEnd: 15,
            title: 'Transmitter TIN',
            value: info=>info.tin,
        },
        {
            position: 16,
            positionEnd: 20,
            title: 'Transmitter Control code',
            value: '     ',
        },
        {
            position: 21,
            positionEnd: 27,
            title: '',
            value: '',
        },
        {
            position: 28,
            positionEnd: 28,
            title: 'Test file indicator',
            value: '',
        },
        {
            position: 29,
            positionEnd: 29,
            title: 'foreign entity indicator',
            value: '',
        },
        {
            position: 30,  //30-69, 70-109
            positionEnd: 109,
            title: 'Transmitter name',
            value: info=>info.company.name,
        },        
        {
            position: 110,   //149
            positionEnd: 189,
            title: 'Company Name',
            value: info => info.company.name,
        },
        {
            position: 190,
            positionEnd: 229,
            title: 'Address',
            value: info => info.company.address,
        },
        {
            position: 230,
            positionEnd: 269,
            title: 'Company City',
            value: info => info.company.city,
        },
        {
            position: 270,
            positionEnd: 271,
            title: 'Company Stae',
            value: info => info.company.state,
        },
        {
            position: 272,
            positionEnd: 280,
            title: 'company zip',
            value: info => info.company.zip,
        },
        {
            position: 281,
            positionEnd: 295,
            title: 'blank',
            value: '',
        },
        {
            position: 296,
            positionEnd: 303,
            title: 'total number payees',
            value: '       1',
        },
        {
            position: 304,
            positionEnd: 343,
            title: 'contact name',
            value: info=>info.contact.name,
        },
        {
            position: 344,
            positionEnd: 358,
            title: 'contact phone',
            value: info => info.contact.phone,
        },
        {
            position: 359,
            positionEnd: 408,
            title: 'email',
            value: info => info.contact.email,
        },
        {
            position: 409,
            positionEnd: 499,
            title: '',
            value: '',
        },
        {
            position: 500,
            positionEnd: 507,
            title: 'record seq',
            value: generateRecordSeq //'00000001',
        },
        {
            position: 508,
            positionEnd: 517,
            title: '',
            value: '',
        },
        {
            position: 518,
            positionEnd: 518,
            title: 'Vendor indicator',
            value: 'I',
        },
        {
            position: 519,
            positionEnd: 558,
            title: 'Vendor name',
            value: info=>info.vendor.name,
        },
        {
            position: 559,
            positionEnd: 598,
            title: 'Vendor addr',
            value: info => info.vendor.address,
        },
        {
            position: 599,
            positionEnd: 638,
            title: 'vendor city',
            value: info => info.vendor.city,
        },
        {
            position: 639,
            positionEnd: 640,
            title: 'Vendor state',
            value: info => info.vendor.state,
        },
        {
            position: 641,
            positionEnd: 649,
            title: 'vendor zip',
            value: info => info.vendor.zip,
        },
        {
            position: 650,
            positionEnd: 689,
            title: 'vendor contact name',
            value: info => info.vendor.name,
        },
        {
            position: 690,
            positionEnd: 704,
            title: 'vendor tel',
            value: info => info.vendor.phone,
        },
        {
            position: 705,
            positionEnd: 739,
            title: '',
            value: '',
        },
        {
            position: 740,
            positionEnd: 740,
            title: 'vendor foreign entity ind',
            value: '',
        },
        {
            position: 741,
            positionEnd: 748,
            title: '',
            value: '',
            
        },
        {
            position: 749,
            positionEnd: 750,
            title: '',
            value: '\r\n',
        },
    ]
}


const ARecord: P1220RecordTemplate<Form1099Info> = {
    name: 'A',
    fields: [
        {
            position: 1,
            positionEnd: 1,
            title: '',
            value: 'A',
        },
        {
            position: 2,
            positionEnd: 5,
            title: 'year',
            value: info=>info.calendarYear,
        },
        {
            position: 6,
            positionEnd: 6,
            title: 'combined federal state filing',
            value: '',
        },
        {
            position: 7,
            positionEnd: 11,
            title: '',
            value: '',
        }, {
            position: 12,
            positionEnd: 20,
            title: 'tax payer tin',
            value: info=>info.payer.tin,
        },
        {
            position: 21,
            positionEnd: 24,
            title: 'issuer name control',
            value: '',
        },
        {
            position: 25,
            positionEnd: 25,
            title: 'last filing ind',
            value: '',
        },
        {
            position: 26,
            positionEnd: 27,
            title: 'type of return',
            value: 'NE', //A 1099 misc, or NE 1099-nec
        },
        {
            position: 28,
            positionEnd: 45,
            title: 'amount codes',
            value: '1', //1, none-employee compensation
        },
        {
            position: 46,
            positionEnd: 51,
            title: '',
            value: '',
        },
        {
            position: 52,
            positionEnd: 52,
            title: 'foreign entity ind',
            value: '',
        },
        {
            position: 53,
            positionEnd: 92,
            title: 'first issuer name line',
            value: info=>info.payer.name,
        },
        {
            position: 93,
            positionEnd: 132,
            title: 'second issuer name line',
            value: '',
        },
        {
            position: 133,
            positionEnd: 133,
            title: 'transfer agent ind',
            value: '0',
        },
        {
            position: 134,
            positionEnd: 173,
            title: 'issuer shipping addr',
            value: info=>info.payer.address,
        },
        {
            position: 174,
            positionEnd: 213,
            title: 'issuer city',
            value: info=>info.payer.city,
        },
        {
            position: 214,
            positionEnd: 215,
            title: 'Issuer state',
            value: info=>info.payer.state,
        },
        {
            position: 216,
            positionEnd: 224,
            title: 'zip',
            value: info=>info.payer.zip,
        },
        {
            position: 225,
            positionEnd: 239,
            title: 'phone',
            value: info=>info.payer.phone,
        },
        {
            position: 240,
            positionEnd: 499,
            title: '',
            value: '',
        },
        {
            position: 500,
            positionEnd: 507,
            title: 'record sequence number',
            value: info => generateRecordSeq(info.transmitterInfo),
        },
        {
            position: 508,
            positionEnd: 748,
            title: '',
            value: '',
        },
        {
            position: 749,
            positionEnd: 750,
            title: '',
            value: '\r\n',
        },
    ]
}


const BRecord: P1220RecordTemplate<Form1099Info> = {
    name: 'B',
    fields: [
        {
            position: 1,
            positionEnd: 1,
            title: '',
            value: 'B',
        },
        {
            position: 2,
            positionEnd: 5,
            title: 'year',
            value: info=>info.calendarYear,
        },
        {
            position: 6,
            positionEnd: 6,
            title: 'Corrected return  ind',
            value: '',
        },
        {
            position: 7,
            positionEnd: 10,
            title: 'name control',
            value: '',
        },
        {
            position: 11,
            positionEnd: 11,
            title: 'type of tin',
            value: info => {
                switch (info.receipient.typeOfTin) {
                    case 'EIN': return '1';
                    case 'SSN':
                    case 'ATIN':
                    case 'ITIN':
                        return '2'
                    default:
                        return '';
                }
            },  //1 ein, 2, ssn/itin/atin, blank n/a 
           
        },
        {
            position: 12,
            positionEnd: 20,
            title: 'payee tin',
            value: info=>info.receipient.tin,
        },
        {
            position: 21,
            positionEnd: 40,
            title: 'Issuers account number for payee',
            value: '',
        },
        {
            position: 41,
            positionEnd: 44,
            title: 'issuer office code',
            value: '',
        },
        {
            position: 45,
            positionEnd: 54,
            title: '',
            value: '',
        }, {
            position: 55,
            positionEnd: 66,
            title: 'payment amount 1',
            value: info=>info.otherIncome,
        },
        {
            position: 67,
            positionEnd: 78,
            title: 'payment amount 2',
            value: '',
        },
        {
            position: 79,
            positionEnd: 90,
            title: 'payment amount 3',
            value: '',
        }, {
            position: 91,
            positionEnd: 102,
            title: 'payment amount 4',
            value: '',
        },
        {
            position: 103,
            positionEnd: 114,
            title: 'payment amount 5',
            value: '',
        },
        {
            position: 115,
            positionEnd: 126,
            title: 'payment amount 6',
            value: '',
        },
        {
            position: 127,
            positionEnd: 138,
            title: 'payment amount 7',
            value: '',
        },
        {
            position: 139,
            positionEnd: 150,
            title: 'payment amount 8',
            value: '',
        }, {
            position: 151,
            positionEnd: 162,
            title: 'payment amount 9',
            value: '',
        },
        {
            position: 163,
            positionEnd: 174,
            title: 'payment amount 10',
            value: '',
        },
        {
            position: 175,
            positionEnd: 270,
            title: 'payment amount B to J',
            value: '',
        },
        {
            position: 271,
            positionEnd: 286,
            title: '',
            value: '',
        }, {
            position: 287,
            positionEnd: 287,
            title: 'foreign country indicator',
            value: '',
        },
        {
            position: 288,
            positionEnd: 327,
            title: 'First payee name lie',
            value: info=>info.receipient.name,
        },
        {
            position: 328,
            positionEnd: 367,
            title: 'second payee name line',
            value: '',
        },
        {
            position: 368,
            positionEnd: 407,
            title: 'payee addr',
            value: info=>info.receipient.street,
        },
        {
            position: 408,
            positionEnd: 447,
            title: '',
            value: '',
        },
        {
            position: 448,
            positionEnd: 487,
            title: 'city',
            value: info=>info.receipient.city,
        },
        {
            position: 488,
            positionEnd: 489,
            title: 'state',
            value: info => info.receipient.state,
        },
        {
            position: 490,
            positionEnd: 498,
            title: 'zip',
            value: info => info.receipient.zip,
        },
        {
            position: 499,
            positionEnd: 499,
            title: '',
            value: '',
        },
        {
            position: 500,
            positionEnd: 507,
            title: 'seq',
            value: info => generateRecordSeq(info.transmitterInfo),
        },
        {
            position: 508,
            positionEnd: 543,
            title: '',
            value: '',
        },
        //for nec
        {
            position: 544,
            positionEnd: 544,
            title: 'second tin notice',
            value: '',
        },
        {
            position: 545,
            positionEnd: 546,
            title: '',
            value: '',
        },
        {
            position: 547,
            positionEnd: 547,
            title: 'direct sales ind',
            value: '',
        },
        {
            position: 548,
            positionEnd: 663,
            title: '',
            value: '',
        },
        {
            position: 664,
            positionEnd: 722,
            title: 'special data entries',
            value: '',
        },
        {
            position: 723,
            positionEnd: 734,
            title: 'state income tax withheld',
            value: '0'.padEnd(12,'0'),
        },
        {
            position: 735,
            positionEnd: 746,
            title: 'local incom tax',
            value: '0'.padEnd(12, '0'),
        },
        {
            position: 747,
            positionEnd: 748,
            title: 'combine dfed state code',
            value: '',
        },
        {
            position: 749,
            positionEnd: 750,
            title: '',
            value: '\r\n',
        },
    ]
}


const CRecord: P1220RecordTemplate<TransmitterInfo> = {
    name: 'C',
    fields: [
        {
            position: 1,
            positionEnd: 1,
            title: '',
            value: 'C',
        },
        {
            position: 2,
            positionEnd: 9,
            title: 'number of payees',
            value: info=>info.forms.length.toString().padStart(8,'0'),
        },
        {
            position: 10,
            positionEnd: 15,
            title: '',
            value: '',
        },
        {
            position: 16,
            positionEnd: 33,
            title: 'control total 1',
            value: info => (info.forms.reduce((acc, fm) => {
                acc += Math.trunc(parseFloat(fm.otherIncome)*100);
                return acc;
            }, 0) / 100).toString().padStart(18, '0'),            
        },
        {
            position: 34,
            positionEnd: 339,
            title: '',
            value: '',
            pad: '0',
            padType: 'start',
        },
        {
            position: 340,
            positionEnd: 499,
            title: '',
            value: '',            
        },
        {
            position: 500,
            positionEnd: 507,
            title: 'seq',
            value: generateRecordSeq,
        },
        {
            position: 508,
            positionEnd: 748,
            title: '',
            value: '',
        },
        {
            position: 749,
            positionEnd: 750,
            title: '',
            value: '\r\n',
        },
    ]
}



function doFields<T>(name: string, fields: P1220RecordFieldTemplate<T>[], info: T)
{
    return fields.reduce((acc, field) => {
        if (field.position !== acc.pos) {
            throw new Error(`Bad position for field type ${name} position ${field.position}/${field.positionEnd}: ${field.title}, prev field=${acc.pos}`);
        }
        const valOrFun = field.value;
        let val = '';
        if (typeof valOrFun === 'function') {
            val = valOrFun(info);
        }
        else {
            val = valOrFun;
        }
        const len = field.positionEnd - field.position + 1;
        if (val.length > len) {
            throw new Error(`Bad position for field type ${name} position ${field.position}/${field.positionEnd}: ${field.title}, prev field=${acc.pos} val too long ${val}, len=${len}`);
        }
        let valPadded = val;
        if (field.padType === 'start') {
            valPadded = val.padStart(len, field.pad || ' ');
        }
        else {
            valPadded = val.padEnd(len, field.pad || ' ');
        }
        acc.line += valPadded;
        acc.pos = acc.line.length + 1;
        if (acc.line.length !== field.positionEnd) {
            throw new Error(`Bad position for field type ${name} position ${field.position}/${field.positionEnd}: ${field.title}, prev field=${acc.pos}, after add line=${acc.line.length} != ${field.positionEnd}`);
        }
        return acc;
    }, {
        line: '',
        pos: 1,
    });
}


function getDefaultTransimiterInfo(): TransmitterInfo {
    const info: TransmitterInfo = {
        calendarYear: '2024',
        tin: '11222222',
        company: {
            name: 'transmit cmpany',
            address: 'transmiter addr',
            city: 'transmiter city',
            state: 'ga',
            zip: '22222',
            //phone: string;
            //email: string;
        },
        contact: {
            name: 'tran contact name',
            phone: '1111111111',
            email: 'transmiter@gmail.com',
        },
        vendor: {
            name: 'vend cmpany',
            address: 'tvender addr',
            city: 'trvendr city',
            state: 'ga',
            zip: '22222',
            phone: '1111111111',
            email: 'venderr@gmail.com',
        },
        forms: [],
        recordSeq: 1,
    };
    return info;
}


export type PureForm1099Info = Omit<Form1099Info, 'transmitterInfo'>;
export function getTransmitterInfoFrom1099(f1099s: PureForm1099Info[]) {
    const transitterInfo = getDefaultTransimiterInfo();
    (f1099s as Form1099Info[]).forEach(f => {
        f.transmitterInfo = transitterInfo;
        transitterInfo.forms.push(f);
    })
    return transitterInfo;
}


function debugGetFake() {
    const singleInf: PureForm1099Info = {
        otherIncome: '123',
        calendarYear: '2024',
        payer: {
            tin: 'tin1111',
            name: 'testtest test',
            address: 'payer addr',
            city: 'city a',
            state: 'ga',
            zip: '20000',
            phone: '1111111111',
            //email: string
        },
        receipient: {
            tin: '111222',
            typeOfTin: 'EIN',
            name: 'recipername',
            street: 'recipstreet',
            city: 'recipet city',
            state: 'recipent state',
            zip: '23333',
        },
    };
    return singleInf;
}

export function getp1220(infos: PureForm1099Info[]) {
    const res: string[] = [];
    const tran = getTransmitterInfoFrom1099(infos);
    const t = doFields('T', TRecord.fields, tran);
    res.push(t.line);

    tran.forms.forEach(f => {
        const a = doFields('A', ARecord.fields, f);
        res.push(a.line);
        const b = doFields('B', BRecord.fields, f);
        res.push(b.line)
    })        
    const c = doFields('C', CRecord.fields, tran);
    res.push(c.line)
    return res.join('');
}