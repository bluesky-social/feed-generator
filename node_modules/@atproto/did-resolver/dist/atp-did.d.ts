import { DIDDocument } from 'did-resolver';
export declare type AtpData = {
    did: string;
    signingKey: string;
    recoveryKey: string;
    handle: string;
    atpPds: string;
};
export declare const getDid: (doc: DIDDocument) => string;
export declare const getKey: (doc: DIDDocument, id: string) => string | undefined;
export declare const getHandle: (doc: DIDDocument) => string | undefined;
export declare const getAtpPds: (doc: DIDDocument) => string | undefined;
export declare const parseToAtpDocument: (doc: DIDDocument) => Partial<AtpData>;
export declare const ensureAtpDocument: (doc: DIDDocument) => AtpData;
