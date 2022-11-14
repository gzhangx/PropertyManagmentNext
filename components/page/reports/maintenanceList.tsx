import React from 'react';
import { GenList } from '../../uidatahelpers/GenList';

export function MaintenanceRecords(props) {
    return <GenList {...props} table={'maintenanceRecords'} title={'Maintenance Records'} />
}
