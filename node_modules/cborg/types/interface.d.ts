import { Token } from './lib/token';
import { Bl } from './lib/bl';
export type TokenOrNestedTokens = Token | Token[] | TokenOrNestedTokens[];
export interface Reference {
    parent: Reference | undefined;
    obj: object | any[];
    includes(obj: object | any[]): boolean;
}
export type OptionalTypeEncoder = (data: any, typ: string, options: EncodeOptions, refStack?: Reference) => TokenOrNestedTokens | null;
export type StrictTypeEncoder = (data: any, typ: string, options: EncodeOptions, refStack?: Reference) => TokenOrNestedTokens;
export type TokenTypeEncoder = {
    (buf: Bl, token: Token, options?: EncodeOptions): void;
    compareTokens(t1: Token, t2: Token): number;
    encodedSize?(token: Token, options?: EncodeOptions): number;
};
export type MapSorter = (e1: (Token | Token[])[], e2: (Token | Token[])[]) => number;
export type QuickEncodeToken = (token: Token) => Uint8Array | undefined;
export interface DecodeTokenizer {
    done(): boolean;
    next(): Token;
}
export type TagDecoder = (inner: any) => any;
export interface DecodeOptions {
    allowIndefinite?: boolean;
    allowUndefined?: boolean;
    coerceUndefinedToNull?: boolean;
    allowInfinity?: boolean;
    allowNaN?: boolean;
    allowBigInt?: boolean;
    strict?: boolean;
    useMaps?: boolean;
    rejectDuplicateMapKeys?: boolean;
    retainStringBytes?: boolean;
    tags?: TagDecoder[];
    tokenizer?: DecodeTokenizer;
}
export interface EncodeOptions {
    float64?: boolean;
    addBreakTokens?: boolean;
    mapSorter?: MapSorter;
    quickEncodeToken?: QuickEncodeToken;
    typeEncoders?: {
        [typeName: string]: OptionalTypeEncoder;
    };
}
//# sourceMappingURL=interface.d.ts.map