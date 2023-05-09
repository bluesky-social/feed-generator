export declare const DID_KEY_BASE58_PREFIX = "did:key:z";
export declare type ParsedDidKey = {
    jwtAlg: string;
    keyBytes: Uint8Array;
};
export declare const parseDidKey: (did: string) => ParsedDidKey;
export declare const formatDidKey: (jwtAlg: string, keyBytes: Uint8Array) => string;
