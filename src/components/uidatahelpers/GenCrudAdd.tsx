import React, { useEffect } from 'react';
import { get } from 'lodash';
import {Dialog, createDialogPrms} from '../dialog'
import { DisplayCustomFormatFieldOriginalDataSufix, IDBFieldDef, isColumnSecurityField, TableNames } from '../types';
import { IEditTextDropdownItem } from '../generic/GenericDropdown';
import { IGenGrudProps } from './GenCrud';
import * as RootState from '../states/RootState'
import moment from 'moment';
import { ALLFieldNames, DataToDbSheetMapping, ICrudAddCustomObj, ItemType, } from './datahelperTypes';
import { usePageRelatedContext } from '../states/PageRelatedState';
import GrkEditableDropdown from '../generic/GrkEditableDropdown';




//export type ItemType = ItemTypeDict & { _vdOriginalRecord: ItemTypeDict; }; //{ [key: string]: FieldValueType; };
export interface IGenGrudAddProps extends IGenGrudProps {
    columnInfo: IDBFieldDef[];
    editItem: ItemType;
    setEditItem: React.Dispatch<React.SetStateAction<ItemType>>;
    //doAdd: (data: ItemType, id: FieldValueType) => Promise<{ id: string; message: string; affectedRows?: number; changedRows?: number; }>; //defined in GenCrudProps
    //onOK?: (data?:ItemType) => void;
    onCancel: (data?:ItemType) => void;
    onError?: (err: { message: string; missed: any; }) => void;
        
    operation: 'Add' | 'Update';
    show: boolean;
  
    sheetMapping?: DataToDbSheetMapping;

    crudAddCustomObjMap: ICrudAddCustomObj<unknown>;
    setCrudAddCustomObjMap: React.Dispatch<React.SetStateAction<ICrudAddCustomObj<unknown>>>;
}
export const GenCrudAdd = (props: IGenGrudAddProps) => {

    const mainCtx = usePageRelatedContext();
    const rootCtx = RootState.useRootPageContext();
    const { columnInfo, doAdd, onCancel,
        editItem, //only available during edit
        setEditItem,
        onError,
        show,
        table,

        //fkDefs,
        operation,

        crudAddCustomObjMap, setCrudAddCustomObjMap,
    }
        = props;
    
        
    //const getForeignKeyProcessor = fk => get(fkDefs, [fk, 'processForeignKey']);
    //let id:string|number = '';
    const { idName, id } = columnInfo.reduce((acc, col) => {
        if (col.isId && !col.userSecurityField) {
            return {
                idName: col.field,
                id: editItem?.data[col.field as ALLFieldNames] as string,
            };
        }
        return acc;
    }, {
        idName: '',
        id: '',
    });

    const isUpdateExisting = !!id;
    const isCreateAddNewItem = !isUpdateExisting;
    const addUpdateLabel = props.operation;
    const onOK =  onCancel;
    const internalCancel = () => onOK();

    const requiredFields = columnInfo.filter(c => c.required && !c.isId && !isColumnSecurityField(c)).map(c => c.field);
    const requiredFieldsMap = requiredFields.reduce((acc, f) => {
        acc[f] = true;
        return acc;
    }, {} as any);


    //const [errorText, setErrorText] = useState('');
    //const [addNewForField, setAddNewForField] = useState('');
    //const [optsData, setOptsData] = useState<{[keyName:string]:IEditTextDropdownItem[]}>({});
    const handleChange = (e:any) => {
        const { name, value } = e.target;
        if (!editItem) return;
        editItem.data[name as ALLFieldNames] = value;
        setEditItem({
            ...editItem, 
            data: {
                ...editItem.data,
            }
         });
    }

    const handleSubmit = async (e:any) => {
        e.preventDefault();

        if (!editItem) return;
        const data = editItem;
        const missed = requiredFields.filter(r => !data.data[r as ALLFieldNames]);
        if (missed.length === 0) {
            const ret = await doAdd(data, id);            
            //handleChange(e, ret);
            if (ret.message && ret.affectedRows === undefined) {
                if (onError) {
                    onError({
                        ...ret,
                        message: ret.message || '',
                        missed: null,
                    })
                } else {
                    mainCtx.showLoadingDlg(ret.message, 'Save Error')
                }
                return;
            }
            const fid = id || ret.id;
            onOK({
                ...data,
                data: {
                    ...data.data,
                    [idName]: fid,
                    id: fid,
                }                
            });
        } else {
            if (onError) {
                onError({
                    message: `missing required fields ${missed.length}`,
                    missed,
                });
            }
            return;
        }
    }

    const optsDataReqSent = {

    }

    // useEffect(() => {
    //     async function doLoads() {
    //         let cur = optsData;;
    //         for (let i = 0; i < columnInfo.length; i++) {
    //             const c = columnInfo[i];
    //             if (c.foreignKey) {
    //                 const optKey = c.foreignKey.table;

    //                 const processForeignKey = getForeignKeyProcessor(optKey);
    //                 if (processForeignKey && !optsData[optKey]) {
    //                     const helper = await createAndLoadHelper(rootCtx, mainCtx, {
    //                         ...props,
    //                         table: optKey,
    //                     });
    //                     //await helper.loadModel();
    //                     const optDataOrig = await helper.loadData();
    //                     const optData = optDataOrig.rows;
    //                     cur = Object.assign({}, cur, {
    //                         [optKey]: processForeignKey(c.foreignKey, optData)
    //                     });                        
    //                 }
    //             }
    //         }

    //         setOptsData(cur);

    //     }
    //     doLoads();
    // }, [table, columnInfo]);

    useEffect(() => {
        mainCtx.checkLoadForeignKeyForTable(table);
    }, [JSON.stringify(editItem)])
    // const [columnInfoMaps, setColumnInfoMaps] = useState<{
    //     [name: string]: {
    //         columnInfo: IDBFieldDef[];
    //         helper: IHelper;
    //     }
    // }>({});
    // const loadColumnInfo = async (colInf: IDBFieldDef[]) => {
    //     const hasFks = colInf.filter(c => c.foreignKey).filter(c => c.foreignKey.table);
    //     await bluebird.Promise.map(hasFks, async fk => {
    //         const tbl = fk.foreignKey.table;
    //         const helper = await createAndLoadHelper(rootCtx, mainCtx, {
    //             ...props,
    //             table: tbl,
    //         });
    //         await helper.loadModel();
    //         const columnInfo = helper.getModelFields().map(x => x as IDBFieldDef);
    //         setColumnInfoMaps(prev => {
    //             return {
    //                 ...prev,
    //                 [tbl]: {
    //                     helper,
    //                     columnInfo,
    //                 }
    //             };
    //         });
    //     })
    // }
    // useEffect(() => {
    //     loadColumnInfo(columnInfo);
    // }, [columnInfo]);
    const checkErrorInd = (c:any) => {
        if (requiredFieldsMap[c.field] && editItem && !editItem.data[c.field as ALLFieldNames])
            return "alert-danger";
        return '';
    }
    const dspClassName = `modal ${show ? ' modal-show ' : 'modal'}`;
    const errDlgPrm = createDialogPrms();
    const setErrorText = (txt:string) => {
        errDlgPrm.setDialogInfo({
            show: true,
            body: txt,
            title: 'error',
        })
    }

    return <div className={dspClassName} tabIndex={-1} role="dialog" >
        <Dialog dialogInfo={errDlgPrm}></Dialog>        
        <div className="modal-dialog gg-modal-dialog-scrollable" role="document">
        <div className="modal-content centered-container ">
            <div className="modal-header centered-container ">
                    <div className="centered-container headerFont" style={{textAlign:'center'}}>{props.editTitle}</div>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true" onClick={internalCancel}>&times;</span>
                </button>
            </div>                
                <table className='centered-table'>
                    <tbody>
                {
                    columnInfo.map((c, cind) => {
                        if (isCreateAddNewItem) { //operation === 'Add') { //  !editItem
                            //create                            
                            //if (c.type === 'date') {
                            //    editItem.data[c.field] = mainCtx.browserTimeToUTCDBTime(moment())//  moment().format('YYYY-MM-DD');
                            //} else {
                                if (c.isId) return null;
                            //}
                        } else {
                            //modify
                            if (c.isId) return <tr className='row' key={cind}><td>{editItem.data[c.field as ALLFieldNames] || ''}</td></tr>
                            if (c.displayCustomFormatField) {
                                editItem.data[c.field as ALLFieldNames] = editItem.data[c.field + DisplayCustomFormatFieldOriginalDataSufix as ALLFieldNames];
                            }
                        }
                        if (isColumnSecurityField(c)) {
                            editItem.data[c.field as ALLFieldNames] = '';
                            return null;  
                        } 


                        const createSelection = (optName: TableNames, colField: string) => {                            
                            const fops = mainCtx.foreignKeyLoopkup.get(optName);
                            if (!fops) return null;
                            const selOptions = fops.specialOptionGenerator ? fops.specialOptionGenerator(editItem.data) :  fops.rows.map(r => {
                                return {
                                    label: r.desc,
                                    value: r.id,
                                    selected: false,
                                }
                            }) // optsData[optName];
                            //if (!selOptions) return null;
                            //const options = selOptions.map(s=>({...s, selected: false,})).concat({
                            //    label: 'Add New',
                            //    value: 'AddNew',
                            //    selected: false,
                            //})
                            const options = selOptions;
                            return createSelectionFromOptions(options, colField);
                        };

                        const createSelectionFromOptions = (options: IEditTextDropdownItem[], colField: string) => {                            
                            
                            if (isCreateAddNewItem && options.length > 0) { //props.operation === 'Add'
                                const curSelection = options.filter(o => o.value === get(editItem.data, colField))[0];
                                if (curSelection) {
                                    curSelection.selected = true;
                                } else {
                                    options[0].selected = true;
                                }
                            } else {
                                const curSelection = options.filter(o => o.value === get(editItem.data, colField))[0];
                                if (curSelection) {
                                    curSelection.selected = true;
                                }
                            }
                            return <>

                                <GrkEditableDropdown items={options}
                                    onSelectionChanged={
                                        async (s: IEditTextDropdownItem) => {                                            
                                            editItem.data[colField as ALLFieldNames] = s.value;
                                            let newItem = editItem;
                                            if (props.customEditItemOnChange) {
                                                newItem = await props.customEditItemOnChange(mainCtx, colField, setCrudAddCustomObjMap, newItem, isCreateAddNewItem); // operation === 'Add'
                                            }
                                            setEditItem(prev => {
                                                return {
                                                    ...prev,
                                                    data: {
                                                        ...prev.data,
                                                        ...newItem.data
                                                    }
                                                };
                                            });    //, [colField+'_labelDesc']: s.label
                                        }
                                    }
                                ></GrkEditableDropdown>
                            </>
                        };
                        let foreignSel = null;
                        if (c.foreignKey) {
                            const optKey = c.foreignKey.table;
                            foreignSel = createSelection(optKey, c.field);
                        }
                        const specialFeighKey = (crudAddCustomObjMap as any)[c.field];
                        if (specialFeighKey) {
                            foreignSel = createSelectionFromOptions(specialFeighKey.options, c.field);
                        }

                        if (c.userSecurityField) return null;
                        if (c.autoYYYYMMFromDateField) return null;
                        const style = {} as React.CSSProperties;
                        if (c.foreignKey) {
                            style.width = '400px';
                        }
                        return <tr key={cind}>
                            <td>{c.desc}</td>
                            <td className={checkErrorInd(c)} style={style}>
                                {
                                    foreignSel || <input type="text" className="form-control bg-light border-0 small" placeholder={c.field}                
                                        value={editItem.data[c.field as ALLFieldNames] as string} name={c.field} onChange={handleChange} />
                                }
                            </td>
                            <td className={checkErrorInd(c)}>{checkErrorInd(c) && '*'}</td>
                        </tr>
                    })
                        }
                    </tbody>
                </table>
            {                
                    <div className="modal-footer">
                        {
                            //addUpdateLabel === 'Update'
                        isUpdateExisting && props.customFooterButton && props.customFooterButton(mainCtx, crudAddCustomObjMap, setCrudAddCustomObjMap, editItem).customFooterUI
                        }
                        <button type="button" className="btn btn-primary" data-dismiss="modal" onClick={
                            async e => {
                                await handleSubmit(e);
                                if (props.customFooterButton) {
                                    await props.customFooterButton(mainCtx, crudAddCustomObjMap, setCrudAddCustomObjMap, editItem).customFooterFunc();
                                }
                            }
                        }>{addUpdateLabel}</button>
                        <button type="button" className="btn btn-secondary" data-dismiss="modal" onClick={internalCancel}>Cancel</button>
                    </div>             
            }
        </div>
        </div>
    </div>
    /*
    return (
        <Modal show={show} onHide={internalCancel} backdrop='static'>
            <Modal.Header closeButton>
                <Modal.Title>{desc}</Modal.Title>
            </Modal.Header>
            <Container>
                <Modal show={!!errorText} onHide={() => {
                    setErrorText('');
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>{errorText}</Modal.Title>
                    </Modal.Header>
                    <Container>
                    </Container>
                </Modal>
                {
                    columnInfo.filter(c => c.foreignKey).filter(c => c.foreignKey.table && columnInfoMaps[c.foreignKey.table]).map((c, cind) => {
                        const thisTbl = c.foreignKey.table;
                        const processForeignKey = getForeignKeyProcessor(thisTbl);
                        if (!processForeignKey) return;
                        const { helper, columnInfo } = columnInfoMaps[thisTbl];
                        const doAdd = (data, id) => {
                            return helper.saveData(data, id).then(res => {
                                return res;
                            }).catch(err => {
                                console.log(err);
                                setErrorText(err.message);
                            });
                        }
                        const addDone = async added => {
                            if (!added) {
                                setAddNewForField('');
                                return setErrorText('Cancelled');
                            }
                            const optDataOrig = await columnInfoMaps[thisTbl].helper.loadData();
                            const optData = optDataOrig.rows;
                            setOptsData(prev => {
                                return {
                                    ...prev,
                                    [thisTbl]: processForeignKey(c.foreignKey, optData)
                                }
                            });
                            setData(prev => {
                                return {
                                    ...prev,
                                    [c.field]: added.id,
                                }
                            })
                            setAddNewForField('');
                        }
                        return <GenCrudAdd key={cind} columnInfo={columnInfo} doAdd={doAdd} onCancel={addDone} show={addNewForField === c.field}></GenCrudAdd>
                    }).filter(x => x)
                }
                {
                    columnInfo.map((c, cind) => {
                        if (!editItem) {
                            if (c.isId) return null;
                        }
                        if (c.dontShowOnEdit) return null;

                        const createSelection = (optName, colField) => {
                            const selOptions = optsData[optName];
                            if (!selOptions) return null;
                            const options = selOptions.concat({
                                label: 'Add New',
                                value: 'AddNew',
                            })
                            const curSelection = options.filter(o => o.value === get(data, colField))[0] || {};
                            return <>
                                <EditDropdown context={{
                                    curSelection,
                                    setCurSelection: s => {
                                        if (s.value === 'AddNew') {
                                            setAddNewForField(colField);
                                        } else
                                            setData({ ...data, [colField]: s.value });
                                    },
                                    getCurSelectionText: o => o.label || '',
                                    options, setOptions: null,
                                    loadOptions: () => [],
                                }}></EditDropdown>
                            </>
                        };
                        let foreignSel = null;
                        if (c.foreignKey) {
                            const optKey = c.foreignKey.table;
                            foreignSel = createSelection(optKey, c.field);
                        }
                        const custFieldType = customFields[c.field];
                        if (custFieldType === 'custom_select') {
                            foreignSel = createSelection(c.field, c.field);
                        }
                        const fieldFormatter = c.dspFunc || (x => x);
                        return <Row key={cind}>
                            <Col>{c.desc}</Col>
                            <Col className={checkErrorInd(c)}>
                                {
                                    foreignSel || < Form.Control as="input" value={fieldFormatter(data[c.field])} name={c.field} onChange={handleChange} />
                                }
                            </Col>
                            <Col xs={1} className={checkErrorInd(c)}>{checkErrorInd(c) && '*'}</Col>
                        </Row>
                    })
                }
                <Modal.Footer>
                    <Row>
                        <Col>
                            <Button className="btn-primary" type="submit" onClick={handleSubmit} >{addUpdateLabel}</Button>
                        </Col>
                        <Col>
                            <Button className="btn-secondary" onClick={internalCancel} >Cancel</Button>
                        </Col>
                    </Row>
                </Modal.Footer>
            </Container>
        </Modal>
    )
    */
}