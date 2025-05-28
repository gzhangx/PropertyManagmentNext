import { useState } from 'react';
import * as api from '../../../components/api'
import { Button } from '@mui/material';
import * as uuid from 'uuid';

async function browserRequest(action: string, text?: string) {
    return await api.doPost(`misc/browser/startBrowserControl?action=${action}&${text}`, undefined, 'GET');
}
export default function BrowserControl() {
    const [base64String, setbase64String] = useState<string>('');

    return <div>
        <Button onClick={async () => {
            const res = await browserRequest('pict')
            console.log(res);
            
        }}>Take Picture</Button>

        <div >
            <img src={`data:image/png;base64,${base64String}`} alt="" />
        </div>
    </div>
}