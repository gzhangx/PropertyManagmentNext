import { useEffect, useState } from 'react';
import * as api from '../../components/api';
import { ILeaseInfo } from '../../components/reportTypes';

export default function SetDefaultLeaseDueDay() {
    const [leases, setLeases] = useState<ILeaseInfo[]>([]);
    useEffect(() => {
        const load = async () => {
            const leases = await api.getLeases();
            console.log(leases);
            setLeases(leases);
        };
        load();
    }, []);


    return <div>
        <div><button className='btn btn-primary' onClick={async () => {
            for (const l of leases) {
                l.rentDueDay = 5;
                await api.sqlAdd('leaseInfo', l as any, false, true);
            }
        }}>Set</button></div>
        <table>
        {
            leases.map(l => {
                return <tr><td>{l.startDate}</td><td>{l.houseID}</td><td>{l.rentDueDay}</td></tr>
            })
        }
    </table>
    </div>
}