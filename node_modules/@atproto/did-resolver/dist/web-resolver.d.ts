import { DIDResolver } from 'did-resolver';
export declare const DOC_PATH = "/.well-known/did.json";
export declare type WebResolverOptions = {
    timeout: number;
};
export declare const makeResolver: (opts: WebResolverOptions) => DIDResolver;
