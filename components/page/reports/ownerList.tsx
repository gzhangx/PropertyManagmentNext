import React  from 'react';
import {GenList} from '../../uidatahelpers/GenList';

export function OwnerList(props) {   
    return <GenList {...props} table={'ownerInfo'} title={'Owner List'}/> 
}
