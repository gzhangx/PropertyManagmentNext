import { ALLFieldNames } from "../../page/imports2/types";
import { IHelperProps } from "../datahelpers";

const fieldMap: ALLFieldNames[]=[
    'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip',
    '', //contact
    'email',
    'phone',
]

export const workerInfoDef: IHelperProps = {
    table: 'workerInfo',
    sheetMapping: {
        sheetName: 'Workers Info',
        range: 'A1:K',
        mapping: [
            'workerID', 'workerName', 'taxName', 'taxID', 'address', 'city', 'state', 'zip',
            '', //contact
            'email',
            'phone',
        ]
    }
}