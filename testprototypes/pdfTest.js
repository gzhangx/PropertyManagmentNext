const { util } = require('@gzhangx/googleapi')
const { PDFDocument } = require('pdf-lib');
const fs = require('fs')
util.doHttpRequest({
    method: 'GET',
    url: 'https://www.irs.gov/pub/irs-pdf/f1099msc.pdf',
}).then(async res => {
    fs.writeFileSync('1099.pdf', res.data);
    const pdfDoc = await PDFDocument.load(res.data);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const formData = {
        payer: {
            addres: 'addr',
            city: 'city',
            state: 'GA',
            zip: '11111',
            phone: 'phone2222',
            tin: '1111',            
        },
        receipient: {
            tin: 'rtin',
            name: 'rname',
            street: 'rstreet',
            cityStateZip:'rcityStateZip',
        },
        otherIncome: '12',
        calendarYear:'25'
    }
    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        if (type === 'PDFTextField') {
            const ff = form.getTextField(name);
            const len = ff.getMaxLength() || 10000;
            const matched = name.match(/f([0-9]+)_([0-9]+)/);
            let w = '';
            if (matched) {
                const fieldCount = matched[2];
                switch (fieldCount) {
                    case '2':
                        w = `${formData.payer.address}\n${formData.payer.city}\n${formData.payer.state} ${formData.payer.zip}\n${formData.payer.phone}`;
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
        }
    });
    const bytes = await pdfDoc.save();
    fs.writeFileSync('1099out.pdf', bytes);
})