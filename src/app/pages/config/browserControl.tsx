import { useState } from 'react';
import * as api from '../../../components/api'
import { Box, Button, TextField } from '@mui/material';
import * as uuid from 'uuid';

async function browserRequest(action: 'goto' | 'type' | 'click' | 'pict', text?: string) {
    return await api.doPost(`misc/browser/startBrowserControl?action=${action}&${text}`, undefined, 'GET');
}
export default function BrowserControl() {
    const [base64String, setbase64String] = useState<string>('');
    const [gotoUrl, setGotoUrl] = useState<string>('');
    const [text, setText] = useState<string>('');
    const [position, setPosition] = useState({ x: 0, y: 0 });

    return <div>
        <Button onClick={async () => {
            const res = await browserRequest('pict')
            setbase64String(Buffer.from(res).toString('base64'));
            
        }}>Take Picture</Button>
        <Button onClick={async () => {
            if (gotoUrl) {
                browserRequest('goto', `text=${gotoUrl}`)
            }

        }}>Go</Button>
        <Button onClick={async () => {
            if (gotoUrl) {
                browserRequest('type', `text=${text}`)
            }

        }}>Type</Button>
        <Box>
            <TextField label="goto" value={gotoUrl} onChange={e => {
                setGotoUrl(e.target.value);                
            }}></TextField>

            <TextField label="Text" value={text} onChange={e => {
                setText(e.target.value);
            }}></TextField>
            <TextField label="Pos" value={`${position.x},${position.y}`}></TextField>
        </Box>
        <div >
            <img src={`data:image/png;base64,${base64String}`} alt="" onMouseMove={event => {
                const rect = (event.target as HTMLImageElement).getBoundingClientRect(); // Get image bounds
                const x = event.clientX - rect.left; // X position relative to image
                const y = event.clientY - rect.top; // Y position relative to image
                setPosition({ x, y });
            }}
                onClick={e => {
                    browserRequest('click', `x=${position.x}&y=${position.y}`)
            }}
            />
        </div>
    </div>
}