
import React, {useState, useEffect} from 'react';
import {EditTextDropdown, IEditTextDropdownItem} from '../../generic/EditTextDropdown'
import {IHouseInfo} from '../../reportTypes'
export interface IMonthRangeProps {    
    allMonthes: string[];
    allHouses: IHouseInfo[];            
    setCurMonthSelection: (a: IEditTextDropdownItem) => void;
    selectedMonths: { [mon: string]: boolean };
    setSelectedMonths: (a: { [mon: string]: boolean }) => void;
    selectedHouses: {[id:string]:boolean};
    setSelectedHouses: (a: any) => void;    
}

export function MonthRange(props) {
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
            label:'All'
       }) 
    },[]);
    return <>
        <div>
        <EditTextDropdown
        items={['All','LastMonth', 'Last3Month', 'Y2D', 'LastYear'].map(value => ({
            value,
                label:value,
        }))}
        onSelectionChanged={sel=>{
            setCurMonthSelection(sel);
        }}
         ></EditTextDropdown>

            <input type='checkbox' checked={showDetails} onChange={() => {
                setShowDetails(!showDetails);
            }}></input> Show Details
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
    </>
}