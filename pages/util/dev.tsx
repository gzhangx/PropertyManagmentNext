import React from 'react';
import { googleSheetRead } from '../../components/api'
import { ImportPage} from '../../components/page/imports/import'
export function DevelopPage() {

    const sheetId = '1UU9EYL7ZYpfHV6Jmd2CvVb6oBuQ6ekTR7AWXIlMvNCg';
    return <div className="container-fluid">
        <ImportPage/>        

        <div className="row">
        
        </div>
    </div>
}


export default DevelopPage;