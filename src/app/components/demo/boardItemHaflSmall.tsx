export default function BoardItemHalfSmall(props: {
    onClick?: () => void;
    iconName?: string;
    mainClsName?: string;
    textClsName?: string;
    title: string;
    valueClsName?: string;
    value: string | React.JSX.Element;
}) {
    const iconClassName = `fas fa-calendar fa-2x text-gray-300 ${props.iconName || 'fa - calendar'}`
    const mainClsName = `card shadow h-100 py-2 ${props.mainClsName || 'border-left-primary'}`;
    const textClsName = `text-xs font-weight-bold text-uppercase mb-1 ${props.textClsName || 'text-primary'}`;
    return <div className="col-xl-3 col-md-6 mb-4" onClick={() => {
        if (props.onClick) {
            props.onClick()
        }
    }}>
        <div className={mainClsName}>
            <div className="card-body">
                <div className="row no-gutters align-items-center">
                    <div className="col mr-2">
                        <div className={textClsName}>{ props.title}</div>
                        <div className={"h5 mb-0 font-weight-bold  " + (props.valueClsName || 'text-gray-800')}>{ props.value }</div>
                    </div>
                    <div className="col-auto">
                        <i className={iconClassName}></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
}