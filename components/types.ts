export type SortOps = '' | 'asc' | 'desc';
export interface ISqlOrderDef {
    name: string;
    op: SortOps;
    shortDesc: string;
}

export interface IPageFilter {
    id: string;
    table: string;
    field: string;
    op: string;
    val: string;
};

export interface IPagePropsByTable {
    [tableName: string]: {
        sorts: ISqlOrderDef[];
        filters: IPageFilter[];
    };
};

export interface IPageState {
    pageProps: IPagePropsByTable;
    setPageProps: any;
}

export interface IOwnerCodes {
    ownerID:  number;
    ownerName: string;
}
export interface ILoginResponse {
    error: string;
    token: string;
    name: string;
    ownerCodes: IOwnerCodes[];
}