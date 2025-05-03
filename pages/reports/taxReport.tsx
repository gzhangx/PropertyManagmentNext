
import { ChangeEvent, useRef, useState } from "react";
import { parsePdfFile, PdfScript } from "../../components/utils/pdfFileUtil";




//pdfjsLib.GlobalWorkerOptions.workerPort = new Worker('//mozilla.github.io/pdf.js/build/pdf.worker.mjs', { type: 'module' });
// The workerSrc property shall be specified.
export default function TaxReport() {
    const [file, setFile] = useState<File>();    

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadClick = () => {
        const { pdfjsLib } = globalThis;
        console.log(file, window, globalThis);
        if (!file) {
            return;
        }


        const reader = new FileReader(); // built in API
        
        reader.onload = async (e) => {
            const contents = e.target?.result;
            if (contents) {
                const arrayBuffer = contents as ArrayBuffer;
                const byteArray = new Uint8Array(arrayBuffer);                
                //console.log(byteArray); // Do something with the byte array
                try {
                    
                    const pdfP = await parsePdfFile(byteArray);
                    const pdf = pdfP.pdf;
                    console.log('after before doc')
                    console.log('num pagses', pdf.numPages);                    
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        console.log('textContent', textContent, page);
                        textContent.items.forEach((item) => {
                            console.log(item); // Do something with the text content
                        });                        
                        break;
                    }
                } catch (error) {
                    console.error('Error loading PDF:', error);
                }

            }
            // const text = contents as string;
        }


        
        // Read the file as text.
        reader.readAsArrayBuffer(file); // readAsText(file) or readAsDataURL(file) or readAsArrayBuffer(file)
        // reader.readAsDataURL(file); // readAsText(file) or readAsDataURL(file) or readAsArrayBuffer(file)
        //reader.readAsText(file);
    };

    return (
        <div>            
            <PdfScript/>
            <h1>Tax Report</h1>
            <input type="file" onChange={handleFileChange} />

            <div>{file && `${file.name} - ${file.type}`}</div>

            <button onClick={handleUploadClick}>Upload</button>
            <FileUploader handleFile={f => {
                const reader = new FileReader(); // built in API

                reader.onload = (e) => {
                    const contents = e.target?.result;
                    if (contents) {
                        const arrayBuffer = contents as ArrayBuffer;   
                    }
                    // const text = contents as string;
                }



                // Read the file as text.
                reader.readAsArrayBuffer(f); 
            }} />
        </div>
    );
}


export const FileUploader = (props: { handleFile: (file:File) => void; }) => {  // Create a reference to the hidden file input element
    const hiddenFileInput = useRef(null);

    // Programatically click the hidden file input element
    // when the Button component is clicked
    const handleClick = event => {
        hiddenFileInput.current.click();
    };  // Call a function (passed as a prop from the parent component)
    // to handle the user-selected file 
    const handleChange = event => {
        const fileUploaded: File = event.target.files[0];
        props.handleFile(fileUploaded);
    }; return (
        <>
            <button className="btn btn-success" onClick={handleClick}>
                Upload W2
            </button>
            <input
                type="file"
                onChange={handleChange}
                ref={hiddenFileInput}
                style={{ display: 'none' }} // Make the file input element invisible
            />
        </>
    );
}



