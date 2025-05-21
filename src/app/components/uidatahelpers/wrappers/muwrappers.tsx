import TextField, { OutlinedTextFieldProps,  } from '@mui/material/TextField';

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