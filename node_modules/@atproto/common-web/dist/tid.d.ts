export declare class TID {
    str: string;
    constructor(str: string);
    static next(): TID;
    static nextStr(): string;
    static fromTime(timestamp: number, clockid: number): TID;
    static fromStr(str: string): TID;
    static newestFirst(a: TID, b: TID): number;
    static oldestFirst(a: TID, b: TID): number;
    static is(str: string): boolean;
    timestamp(): number;
    clockid(): number;
    formatted(): string;
    toString(): string;
    compareTo(other: TID): number;
    equals(other: TID): boolean;
    newerThan(other: TID): boolean;
    olderThan(other: TID): boolean;
}
export default TID;
