
import { useState, useEffect } from 'react'
import Link from 'next/link'
export default function FirstPost() {
    const [lists, setLists] = useState([]);
    

    return <div>
        
        <ul>
            <li><div>Just a test</div></li>
            <li><Link href="/PMReports:CashFlow">Cash Flow</Link></li>
            <li><Link href="/PMInputs:OwnerInfo">PMInputs:OwnerInfo</Link></li>
        <li><Link href="/" legacyBehavior>
            <a>Back to home</a>
            </Link></li>
        </ul>
    </div>
}
