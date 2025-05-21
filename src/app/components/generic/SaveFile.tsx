
interface ISaveFileButtonProps {
    content: string;
    title?: string;
    fileName?: string; 
    className?: string;
}
export function CreateSaveButton(props: ISaveFileButtonProps) {
    const title = props.title || 'Export';
    const fileName = props.fileName || 'saveFile.txt';
    const className = props.className || 'btn btn-primary'
    return <button type="button" className={className} onClick={() => {
        const aTag = document.createElement('a');        
        const data = `data:,${props.content}`.replace(/\n/g, "%0A").replace(/\r/g, "%0D");
        console.log('data is ', data)
        aTag.href = data;
        aTag.download = fileName;
        aTag.click();
    }}>{ title }</button>
}