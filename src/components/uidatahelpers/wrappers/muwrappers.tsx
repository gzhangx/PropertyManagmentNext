import { Box, Chip, FormControl, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select, SelectChangeEvent, Theme, useTheme } from '@mui/material';
import TextField, { OutlinedTextFieldProps, TextFieldProps,  } from '@mui/material/TextField';
import React, { useEffect } from 'react';
import { NumericFormat } from "react-number-format";

export function TextFieldOutlined(props: Omit<OutlinedTextFieldProps,'variant'>) {
    return <TextField
        //label="With normal TextField"
        //id="outlined-start-adornment"
        variant='outlined'
        {...props}
        
        //sx={{ m: 1, width: '25ch' }}
        //slotProps={{
        //    input: {
        //        startAdornment: <InputAdornment position="start">kg</InputAdornment>,
        //    },
        //}}
    />
}


type NumberFormatTextFieldProps = TextFieldProps & {
    decimalScale?: number;
    allowNegative?: boolean;
    defaultValue?: string | number;
    value: string | number | null;
};
export function NumberFormatTextField(props: NumberFormatTextFieldProps) {
    return <NumericFormat  {...props}
        customInput={TextField}
        //variant='outlined'
        thousandSeparator={true}
        decimalScale={props.decimalScale ?? 2}
        fixedDecimalScale={true}
        allowNegative={props.allowNegative || false}
        defaultValue={props.defaultValue}
        valueIsNumericString={true}
        type='text'
        //valueIsNumericString={true}
        //getInputRef={inputRef}
        //onValueChange={(values) => {
        //    const { formattedValue, value } = values;
        //    console.log(formattedValue); // + " (formattedValue)"
        //    console.log(value); // + " (value)"
        //}}
        
    ></NumericFormat>
}   


export function CurrencyFormatTextField(props: NumberFormatTextFieldProps) {
    const newProps: NumberFormatTextFieldProps = { ...props };
    if (!newProps.slotProps) {
        newProps.slotProps = {
            input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }
        };
    }
    return <NumberFormatTextField {...newProps}></NumberFormatTextField>
}






export interface MultipleSelectChipItemDef {
    id: string;
    name: string;
}
export function MultipleSelectChip(props: {
    allItems: MultipleSelectChipItemDef[];
    label: string;
    selectedIds?: string[];
}) {
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const theme = useTheme();
    const [items, setItems] = React.useState<MultipleSelectChipItemDef[]>([]);

    useEffect(() => {
        const selectedIds = props.selectedIds;
        if (selectedIds) {
            const selectedItems = props.allItems.filter(item => selectedIds.includes(item.id));
            setItems(selectedItems);
        }
    }, [props.selectedIds]);

    function getStyles(item: MultipleSelectChipItemDef, selected: readonly MultipleSelectChipItemDef[], theme: Theme) {
        return {
            fontWeight: selected.find(i => i.id === item.id)
                ? theme.typography.fontWeightMedium
                : theme.typography.fontWeightRegular,
        };
    }

    const handleChange = (event: SelectChangeEvent<MultipleSelectChipItemDef[]>) => {
        const {
            target: { value },
        } = event;
        let setItm: MultipleSelectChipItemDef[];
        if (typeof value === 'string') {
            //should never happen
            const ids = value.split(',');
            setItm = props.allItems.filter(item => ids.includes(item.id));
        } else {
            setItm = value;
        }
        setItems(setItm);
    };

    return (
        <div>
            <FormControl sx={{ m: 1, width: 300 }}>
                <InputLabel>{props.label}</InputLabel>
                <Select
                    //labelId="multiple-chip-label"
                    //id="multiple-chip"
                    multiple
                    value={items}
                    onChange={handleChange}
                    input={<OutlinedInput
                        //id="select-multiple-chip"
                        label={props.label} />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value.id} label={value.name} onDelete={e => {
                                    const newItems = items.filter(item => item.id !== value.id);
                                    setItems(newItems);
                                }}
                                    onMouseDown={(event) => {
                                    event.stopPropagation();
                                  }}
                                />
                            ))}
                        </Box>
                    )}                    
                    MenuProps={{
                        PaperProps: {
                            style: {
                                maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
                                //width: 250,
                            },
                        },
                    }}
                >
                    {props.allItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            value={item as any}
                            style={getStyles(item, items, theme)}
                        >
                            {item.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}