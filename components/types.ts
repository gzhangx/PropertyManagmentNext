export type SortOps = '' | 'asc' | 'desc';
export interface ISqlOrderDef {
    name: string;
    op: SortOps;
    shortDesc: string;
}
