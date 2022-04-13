import request from 'axios'
import { useState, useEffect } from 'react'
import Link from 'next/link'
export default function FirstPost() {
    const [lists, setLists] = useState([]);
    useEffect(() => {
        const nl = [];
        for (let i = 0; i < 5; i++) {
            nl.push(`test ${i}`);
        }
        setLists(nl);
        request.get('https://catfact.ninja/fact').then(r => {
            console.log(r.body.fact);
            if (r.body.fact) {
                nl.push(r.body.fact);
                nl.push('testtest')
                setLists([...nl]);
            }
        })
    },[]);    

    return <div>
        {
            lists.map((l, il) => <h1 key={ il}>{l}</h1>)
        }
        <Link href="/">
            <a>Back to home</a>
        </Link>
    </div>
}
