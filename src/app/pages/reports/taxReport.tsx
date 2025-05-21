'use client'
import { DataGrid, GridCellEditStopParams, GridCellEditStopReasons, GridColDef, GridSingleSelectColDef, MuiEvent } from '@mui/x-data-grid';
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { IPdfTextItem, parsePdfFile, PdfScript } from "../../components/utils/pdfFileUtil";
import { startCase } from "lodash";
import { getUserOptions } from "../../components/api";
import Box from '@mui/material/Box';
import { Button, TextField } from '@mui/material';


interface W2Info {
    id: number;
    income: number;
    fedTax: number;
    stateTax: number;
}
function getPdfLocTracker() {
    const mat = {
        allYs: [] as number[],
        matrix: {} as {
            [y: number]: IPdfTextItem[];
        },        
    };
    function addToMatrix(obj: IPdfTextItem) {
        const { x, y, } = obj;
        let row = mat.matrix[y];
        if (!row) {
            row = mat.matrix[y] = [];
            mat.allYs.push(y);
        }
        
        row.push(obj);                
    }
    function endFix() {
        mat.allYs.sort((a,b)=> a - b);
    }

    function mergeY() {
        mat.allYs.sort((a, b) => a - b);
        const yKeysToDelete = [];
        const combineYDist = 3;
        let lastValToUse: number | null = null;
        let lastY: number = 0;
        for (const y of mat.allYs) {
            const row = mat.matrix[y];
            if (lastValToUse === null) {
                lastY = y;
                lastValToUse = y;
            } else {
                if (y - lastY <= combineYDist) {
                    // merge rows                    
                    yKeysToDelete.push(y);
                    //lastY = y;
                    mat.matrix[lastValToUse] = mat.matrix[lastValToUse].concat(row);
                } else {
                    // keep the last row as is
                    lastY = y;
                    lastValToUse = y;
                }
            }
        }
        for (const y of yKeysToDelete) {
            delete mat.matrix[y];
            mat.allYs = mat.allYs.filter(v => v !== y);
        }
    }
    function getLinesAsArray(pageWidth: number) {
        mergeY();
        ////if (getRTS(item) === '0,11,1,0')        
        const combineXDist = 4;

        const columnSepAt = pageWidth / 6; //if prev x is < 6 but this item >  6, they belong to different columns
        
        const allResultLines: string[][] = [];
        for (const y of mat.allYs.sort((a, b) => a - b)) {
            const row = mat.matrix[y];
            let firstY = 0;
            const items: IPdfTextItem[] = [];
            let lastItem: IPdfTextItem | null = null;
            for (const item of row.sort((a, b) => a.x - b.x)) {                
                    firstY = item.y;
                    if (item.x > pageWidth/3) continue;

                     if (!lastItem || item.x - lastItem.x > combineXDist || (lastItem.x < columnSepAt && item.x > columnSepAt)) {
                         lastItem = { ...item, };
                         items.push(lastItem);
                     } else {
                         lastItem.str = lastItem.str + ' ' + item.str;
                         lastItem.x = item.x;
                         //lastItem = { ...item, };
                         //items.push(lastItem);
                     }
                    //process.stdout.write('['+item.x.toFixed(2).padStart(' ', eachPad) + '] ' + item.text + ' '+ JSON.stringify(item, null, 2).padEnd(' ', eachPad) + ' ');
                    //if (getRTS(item) === '0,11,1,0')

                    //console.log('['+item.x.toFixed(2).padStart(' ', eachPad) + '] ' + item.text + ' '+ JSON.stringify(item, null, 2).padEnd(' ', eachPad) + ' ');                     
            }
            if (items.length) {
                const allDsps: string[] = [];
                allDsps.push('[' + firstY.toFixed(2) + '] ');
                const curRet: string[] = [];
                for (const item of items) {
                    if (item.str.trim()) {
                        allDsps.push('[' + item.x.toFixed(2) + '] ' + item.str + ' ');
                        curRet.push(item.str);
                    }
                }
                //console.log(allDsps.join(''),);
                if (curRet.length) {                    
                    allResultLines.push(curRet);
                }
            }
        }
        return allResultLines;
    }
    function parseW2(lines: string[][]): W2Info {
        let state: 'find-fed' | 'fed' | 'find-state' | 'state' | 'done' = 'find-fed';
        const res = {
            id: 0,
            income: 0,
            fedTax: 0,
            stateTax: 0,
            name:'new',
        }
        for (const line of lines) {
            switch (state) {
                case 'find-fed':
                    console.log('find-fed', line);
                    if (line.find(l => l === 'Wages, tips, other comp.')) {
                        console.log('found fed');
                        state = 'fed';
                    }
                    break;
                case 'fed':
                    console.log('fed', line);
                    const feds = line.filter(l => l && !isNaN(parseFloat(l))).map(l => parseFloat(l));
                    console.log('feds', feds);
                    res.income = feds[0];
                    res.fedTax = feds[1];
                    state = 'find-state';
                    break;
                case 'find-state':
                    if (line.find(l => l === 'State wages, tips, etc.')) {
                        state = 'state';
                    }
                    break;
                case 'state':
                    res.stateTax = parseFloat(line[2]);
                    return res;
            }                    
        }
        return res;
    }
    return {
        mat,
        addToMatrix,
        endFix,
        getLinesAsArray,
        parseW2,
    }
}



//pdfjsLib.GlobalWorkerOptions.workerPort = new Worker('//mozilla.github.io/pdf.js/build/pdf.worker.mjs', { type: 'module' });
// The workerSrc property shall be specified.
export function TaxReportOld() {
    const [file, setFile] = useState<File>();    

    const [w2s, setW2s] = useState<W2Info[]>([]);
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
                    console.log('num pagses', pdfP.numPages);
                    const tracker = getPdfLocTracker();
                    let pageWidth = 0, pageHeight = 0;
                    for (let i = 1; i <= pdfP.numPages; i++) {
                        const page = await pdfP.getPage(i);
                        console.log('page', page.width, page.height);
                        pageWidth = page.width;
                        pageHeight = page.height;
                        page.items.forEach((item) => {
                            if (item.y >= 220 && item.y < 235 && item.x < pageWidth/3) {
                                console.log(item); // Do something with the text content
                            }
                            tracker.addToMatrix(item);
                        });
                        break;
                    }
                    tracker.endFix();
                    const printRes = tracker.getLinesAsArray(pageWidth);
                    //console.log('printRes', printRes);
                    const w2Res = tracker.parseW2(printRes);
                    console.log('page', pageWidth, pageHeight, w2Res);
                    setW2s([...w2s, w2Res]);
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
        <div className="container-fluid">          
            <div className="row">
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
            <div className="row">
                {w2s.map((w2, i) => {
                    return <div key={i}>
                        <h3>W2 {i}</h3>
                        <div>Income: {w2.income}</div>
                        <div>Fed Tax: {w2.fedTax}</div>
                        <div>State Tax: {w2.stateTax}</div>
                        <div><button className="btn btn-primary" onClick={() => {
                            const newW2s = [...w2s];
                            newW2s.splice(i, 1);
                            setW2s(newW2s);
                        }}>delete</button></div>
                    </div>;
                })}
            </div>
        </div>
    );
}


export const FileUploader = (props: { handleFile: (file:File) => void; }) => {  // Create a reference to the hidden file input element
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    // Programatically click the hidden file input element
    // when the Button component is clicked
    const handleClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };  // Call a function (passed as a prop from the parent component)
    // to handle the user-selected file 
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileUploaded: File | undefined = event.target.files?.[0];
        if (fileUploaded) {
            props.handleFile(fileUploaded);
        }
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





export const taxReportDBSaveProps = [
    'estimatedTaxReportW2Information',
] as const;

export function getEstimatedTaxReportNames(name: typeof taxReportDBSaveProps[number]) {
    return startCase(name);
}

export type ITaxReportDBConfig = Record<typeof taxReportDBSaveProps[number], string>;
export async function getPaymentEmailConfigRaw(): Promise<ITaxReportDBConfig> {
    return getUserOptions([]).then(res => {
        const retObj: ITaxReportDBConfig = {} as ITaxReportDBConfig;
        taxReportDBSaveProps.forEach(name => {
            retObj[name] = res.find(r => r.id === name)?.data || '';
        })        
        return retObj;
    })
}


export default function TaxReport() {
    const [w2s, setW2s] = useState<W2Info[]>([]);
    const [newItem, setNewItem] = useState({
        income: '',
        fedTax: '',
        stateTax: '',
      });
    useEffect(() => {
        getPaymentEmailConfigRaw().then(strDict => {
            const w2InfoStr = strDict['estimatedTaxReportW2Information'];
            if (w2InfoStr) {
                setW2s(JSON.parse(w2InfoStr));
            }
        })
    }, []);
    
    // Columns configuration
    const columns: GridColDef<W2Info, any, any>[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'income', headerName: 'Income ($)', width: 130, type: 'number', editable: true, },
        { field: 'fedTax', headerName: 'Federal Tax ($)', width: 150, type: 'number', editable: true, },
        { field: 'stateTax', headerName: 'State Tax ($)', width: 150, type: 'number', editable: true, },        
    ];

    // Handle input change for new item
    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: parseFloat(value) || '' }));
    };

    // Add new item to the grid
    const handleAddItem = () => {
        if (newItem.income && newItem.fedTax && newItem.stateTax) {
            const itemToAdd = {
                id: 0,
                income: parseFloat(newItem.income),
                fedTax: parseFloat(newItem.fedTax),
                stateTax: parseFloat(newItem.stateTax),
            };
            setW2s([...w2s, itemToAdd].map((itm, idx) => {
                return {                    
                    ...itm,
                    id: idx,
                }
            }));
            setNewItem({ income: '', fedTax: '', stateTax: '' });
        }
    };

    const handleCellEditCommit = (params: any) => {
        setW2s(w2s.map(item =>
            item.id === params.id
                ? { ...item, [params.field]: params.value }
                : item
        ));
    };
    return (
        <div style={{ height: 500, width: '100%' }}>
            <Box mb={2} display="flex" gap={2} alignItems="flex-end">
                <TextField
                    name="income"
                    label="Income ($)"
                    type="number"
                    value={newItem.income}
                    onChange={handleInputChange}
                    size="small"
                />
                <TextField
                    name="fedTax"
                    label="Federal Tax ($)"
                    type="number"
                    value={newItem.fedTax}
                    onChange={handleInputChange}
                    size="small"
                />
                <TextField
                    name="stateTax"
                    label="State Tax ($)"
                    type="number"
                    value={newItem.stateTax}
                    onChange={handleInputChange}
                    size="small"
                />
                <Button
                    variant="contained"
                    onClick={handleAddItem}
                    disabled={!newItem.income || !newItem.fedTax || !newItem.stateTax}
                >
                    Add Entry
                </Button>
            </Box>
            <DataGrid
                rows={w2s}
                columns={columns}
                onCellEditStop={(params: GridCellEditStopParams, event: MuiEvent) => {
                    if (params.reason === GridCellEditStopReasons.cellFocusOut) {
                        //event.defaultMuiPrevented = true;
                    }
                    console.log('edit stop prms ', params)
                }}
                processRowUpdate={(updatedRow, originalRow) => {
                    console.log(updatedRow, originalRow)
                    return updatedRow;
                }
                    
                  }
                initialState={{
                    pagination: { paginationModel: { pageSize: 5, page: 0 } }
                }}
                pageSizeOptions={[5]}
            />
        </div>
    );
}