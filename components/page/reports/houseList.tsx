import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

export function HouseList(props) {   
    return <GenList {...props} table={'houseInfo'} title={'House List'}/> 
}
