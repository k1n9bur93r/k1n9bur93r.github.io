export enum DynStreamTypes {
    RECORD = 0,
    PLATE = 1,
    DYN = 3,
}

export interface Type {
    Name: string;
    Id: DynStreamTypes;
}

export interface PlateObjItem {
    value: any;
    isArray: boolean;
    arrayValues: any[];
    recordIndexPath: string;
}

export interface PlateObj {
    Props: Record<string, PlateObjItem>;
    RecordDepth: string | undefined;
    Template: string;
    Render: string;
}