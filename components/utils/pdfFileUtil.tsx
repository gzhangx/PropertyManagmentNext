import Script from "next/script";


declare global {
    var pdfjsLib: any; // Declare pdfjsLib as a global variable
}


export function PdfScript() {
    return <Script src="https://mozilla.github.io/pdf.js/build/pdf.mjs" type="module" strategy="beforeInteractive" onReady={() => {
        const { pdfjsLib } = globalThis;
        // The workerSrc property shall be specified.
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.mjs';
    }} />
}


export interface IParsedPdfRet {
    pdf: any;
    numPages: number;
    getPage: (pageNumber: number) => Promise<{
        items: {
            str: string;
            height: number;
            fontName: string;
        }[];
        page: any;
        witdh: number;
        height: number;
        transform: number[];
    }>;
}
export async function parsePdfFile(data: Uint8Array) {
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    return {
        pdf,
        numPages: pdf.numPages,
        getPage: async (pageNumber: number) => {
            const page = await pdf.getPage(pageNumber);
            const textContent = await page.getTextContent();
            const height = page.view[3];
            return {
                width: page.view[2],    
                height,
                items: textContent.items.map(itm => {
                    return {
                        str: itm.str,
                        height: itm.height,
                        fontName: itm.fontName,
                        x: itm.transform[4],
                        y: height - itm.transform[5],
                        transform: itm.transform,
                    };
                }),
                page,
            };
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
}