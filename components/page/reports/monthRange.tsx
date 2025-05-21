
import React, {useState, useEffect} from 'react';
import {EditTextDropdown} from '../../generic/EditTextDropdown'
import {IHouseInfo} from '../../reportTypes'
import { IEditTextDropdownItem } from '../../generic/GenericDropdown';
export interface IMonthRangeProps {    
    allMonthes: string[];
    allHouses: IHouseInfo[];            
    setCurMonthSelection: (a: IEditTextDropdownItem) => void;
    selectedMonths: { [mon: string]: boolean };
    setSelectedMonths: (a: { [mon: string]: boolean }) => void;
    selectedHouses: {[id:string]:boolean};
    setSelectedHouses: (a: any) => void;    
}

export function MonthRange(props: any) {
    const jjctx = props.jjctx as IMonthRangeProps;
    const {
        allMonthes,
        allHouses,
        setCurMonthSelection, //type IEditTextDropdownItem
        selectedMonths, setSelectedMonths,
        selectedHouses, setSelectedHouses,
    } = jjctx;

    const [showDetails, setShowDetails] = useState(false);
    useEffect(() => {
        setCurMonthSelection({
            value: 'All',
            label: 'All'
        })
    }, []);
    return <div className='modal-body'>
        <div className='row' style={{"verticalAlign":"bottom"}}>
        <EditTextDropdown
                    items={['All', 'LastMonth', 'Last3Month', 'Y2D', 'LastYear'].map(value => ({
                        value,
                        label: value,
                    }))}
                    onSelectionChanged={sel => {
                        setCurMonthSelection(sel);
                    }}
            ></EditTextDropdown>
            
            <div className='form-check' style={{paddingTop:"0.5em"}}>                
                <input type='checkbox' className='form-check-input' checked={showDetails} onChange={() => {
                    setShowDetails(!showDetails);
                }}></input>
                <label className='form-check-label'>Show Details</label>
                </div>            
        </div>
        <div>
            {
                showDetails && <div className='container'>
                    <div className='row'>
                        <div className='col'>
                            {
                                allMonthes.map((m, key) => {
                                    return <div key={key}><input type='checkbox' checked={!!selectedMonths[m]} onChange={() => {
                                        selectedMonths[m] = !selectedMonths[m];
                                        setSelectedMonths({ ...selectedMonths });
                                    }}></input>{m}</div>
                                })
                            }
                        </div>
                        <div className='col'>
                            {
                                allHouses.map((m, key) => {
                                    return <div key={key}><input type='checkbox' checked={!!selectedHouses[m.houseID]} onChange={() => {
                                        selectedHouses[m.houseID] = !selectedHouses[m.houseID];
                                        setSelectedHouses({ ...selectedHouses });
                                    }}></input>{m.address}</div>
                                })
                            }
                        </div>
                    </div>
                </div>
            }
        </div>
    </div>
}