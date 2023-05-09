import { DIDResolver } from 'did-resolver';
export declare type PlcResolverOptions = {
    timeout: number;
    plcUrl: string;
};
export declare const makeResolver: (opts: PlcResolverOptions) => DIDResolver;
