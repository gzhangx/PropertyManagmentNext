import { PDFDocument } from 'pdf-lib'
import JSzip from 'jszip'

import {
    getWorkerInfo,
    doPost,
    getOwnerInfo,
} from '../../../components/api';



export type I1099Info = {
    total: number;
    workerName: string;
    ownerName: string;
    YYYY: string;
};


async function get1099Content(parms: I1099Info, showProgress?: (txt: string) => void) {
    if (!showProgress) showProgress = () => { };
    showProgress('loading workers');
    const workers = await getWorkerInfo();
    const founds = workers.filter(w => w.workerName.toLowerCase().trim() === parms.workerName.toLowerCase().trim());
    if (founds.length > 1) {
        showProgress('Found multiple workers '+parms.workerName);
        return;
    }
    if (founds.length === 0) {
        showProgress('worker not found ' + parms.workerName);
        return;
    }

    const owners = await getOwnerInfo();
    const ownersFound = owners.filter(w => w.ownerName.toLowerCase().trim() === parms.ownerName.toLowerCase().trim());
    if (ownersFound.length > 1) {
        showProgress('Found multiple owners ' + parms.ownerName);
        return;
    }
    if (ownersFound.length === 0) {
        showProgress('Owner not found ' + parms.ownerName);
        return;
    }

    const worker = founds[0];
    const owner = ownersFound[0];
    showProgress('worker found ' + parms.workerName);
    const irsfile = await doPost('misc/statement/1099', {}, 'GET');
    const resultData = write1099PdfFields({
        otherIncome: parms.total.toFixed(2),
        calendarYear: parms.YYYY,
        payer: {
            tin: owner.taxID,
            address: owner.address,
            city: owner.city,
            name: owner.taxName || owner.ownerName,
            phone: owner.phone,
            state: owner.state,
            zip: owner.zip,
        },
        receipient: {
            cityStateZip: `${worker.city}, ${worker.state} ${worker.zip}`,
            name: worker.taxName || worker.workerName,
            street: worker.address,
            tin: worker.taxID,
        },
    }, await irsfile);
    return resultData;
}

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
    };
    receipient: {
        tin: string;
        name: string;
        street: string;
        cityStateZip: string
    };

}


async function write1099PdfFields(formData: Form1099Info, existingPdfBytes: ArrayBuffer): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        //if (type === 'PDFTextField')
        try {
            const ff = form.getTextField(name);
            const len = ff.getMaxLength() || 10000;
            const matched = name.match(/f([0-9]+)_([0-9]+)/);
            let w = '';
            if (matched) {
                const fieldCount = matched[2];
                switch (fieldCount) {
                    case '2':
                        w = `${formData.payer.name}\n${formData.payer.address}\n${formData.payer.city}, ${formData.payer.state} ${formData.payer.zip}\n${formData.payer.phone}`;
                        break;
                    case '3':
                        w = formData.payer.tin;
                        break;
                    case '4':
                        w = formData.receipient.tin;
                        break;
                    case '5':
                        w = formData.receipient.name;
                        break;
                    case '6':
                        w = formData.receipient.street;
                        break;
                    case '7':
                        w = formData.receipient.cityStateZip;
                        break;
                    case '11':
                        w = formData.otherIncome;
                        break;
                    case '1':
                        w = formData.calendarYear;
                        break;
                }
            }
            if (w) {
                ff.setText(w);
            }
        } catch (err) {
            console.log('PDFTextField err due to next minify', err.message);
        }
    });
    const bytes = await pdfDoc.save();
    return bytes;
}


export async function exportOne1099(parms: I1099Info, showProgress?: (txt: string) => void) {
    const rawData = await get1099Content(parms, showProgress);
    if (!rawData) return;
    const blob = new Blob([rawData], {
        type: 'application/pdf'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `1099-${parms.YYYY}-${parms.ownerName}-${parms.workerName}.pdf`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export async function exportMultiple1099(parms: I1099Info[], showProgress?: (txt: string) => void) {
    const zip = new JSzip();
    for (const param of parms) {
        const rawData = await get1099Content(param, showProgress);
        if (!rawData) continue;
        
        const fileName = `1099-${param.YYYY}-${param.ownerName}-${param.workerName}.pdf`;
        if (showProgress) {
            showProgress(`Zipping ${fileName}`);
        }
        zip.file(fileName, rawData)        
        //const blob = new Blob([rawData], {
        //    type: 'application/pdf'
        //});
        
    }
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', `all.zip`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    })
}
