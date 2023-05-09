export declare type Flag = '-' | '-+' | '+' | '0';
declare type LiteralToken = {
    type: 'literal';
    literal: string;
};
export declare type PlaceholderToken = {
    conversion: string;
    flag: Flag | null;
    placeholder: string;
    position: number;
    precision: number | null;
    type: 'placeholder';
    width: number | null;
};
export declare type Token = LiteralToken | PlaceholderToken;
export {};
