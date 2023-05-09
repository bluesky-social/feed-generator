import { DIDResolutionResult } from 'did-resolver';
export declare const error: (errorType: string) => DIDResolutionResult;
export declare const notFound: () => DIDResolutionResult;
export declare const invalidDid: () => DIDResolutionResult;
export declare const unsupported: () => DIDResolutionResult;
