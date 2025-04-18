import React from 'react';
import { GenList } from '../../uidatahelpers/GenList';
import { ITableAndSheetMappingInfo } from '../../uidatahelpers/datahelperTypes';


export function MaintenanceRecords(props) {
    return <GenList {...props} table={'maintenanceRecords'} title={'Maintenance Records'}
        sortFields={
            ['date', 'houseID']
        }
    />
}

// page generated in dashboard.tsx by getGenListParms
export const MaintenanceListConfig: Partial<ITableAndSheetMappingInfo> = {
    sortFields: ['date', 'houseID'],
    title: 'Maintenance Records',
}