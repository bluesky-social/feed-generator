export declare class NSID {
    segments: string[];
    static parse(nsid: string): NSID;
    static create(authority: string, name: string): NSID;
    static isValid(nsid: string): boolean;
    constructor(nsid: string);
    get authority(): string;
    get name(): string | undefined;
    toString(): string;
}
