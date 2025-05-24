import { InputAdornment } from '@mui/material';
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