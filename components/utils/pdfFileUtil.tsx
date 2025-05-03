import Script from "next/script";


declare global {
    var pdfjsLib: any; // Declare pdfjsLib as a global variable
}


export function PdfScript() {
    return <Script src="https://mozilla.github.io/pdf.js/build/pdf.mjs" type="module" strategy="beforeInteractive" onReady={() => {
        const { pdfjsLib } = globalThis;
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';
    }} />
}


export interface IPdfTextItem {
    str: string;
    height: number;
    fontName: string;
    transform: number[];
    x: number;
    y: number;
}

interface IParsedPdfPage {
    items: IPdfTextItem[];
    page: any;
    width: number;
    height: number;
};

export interface IParsedPdfRet {
    pdf: any;
    numPages: number;
    getPage: (pageNumber: number) => Promise<IParsedPdfPage>;
}
export async function parsePdfFile(data: Uint8Array) {
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const ret: IParsedPdfRet = {
        pdf,
        numPages: pdf.numPages,
        getPage: async (pageNumber: number) => {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const height = page.view[3];
            const rpage: IParsedPdfPage = {
                width: page.view[2],    
                height,
                items: textContent.items.map(itm => {
                    const ritm: IPdfTextItem= {
                        str: itm.str,
                        height: itm.height,
                        fontName: itm.fontName,
                        x: itm.transform[4],
                        y: height - itm.transform[5],
                        transform: itm.transform,
                    };
                    return ritm;
                }) as IPdfTextItem[],
                page,
            };
            return rpage;
        },
    }
    // for (let i = 1; i <= pdf.numPages; i++) {
    //     const page = await pdf.getPage(i);
    //     const textContent = await page.getTextContent();
    //     console.log('textContent', textContent, page);
    //     textContent.items.forEach((item) => {
    //         console.log(item); // Do something with the text content
    //     });
    //     break;
    // }
    return ret;
}