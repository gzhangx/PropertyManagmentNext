import TextField, { OutlinedTextFieldProps, TextFieldProps,  } from '@mui/material/TextField';
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


export function NumberFormatTextField(props: TextFieldProps & {
    decimalScale?: number;
    allowNegative?: boolean;
    defaultValue?: string | number;
    value: string | number | null;
}) {
    return <NumericFormat  {...props}
        customInput={TextField}
        //variant='outlined'
        thousandSeparator={true}
        decimalScale={props.decimalScale || 2}
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