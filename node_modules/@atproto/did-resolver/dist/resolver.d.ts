import { Resolver, DIDDocument, DIDResolutionOptions, DIDResolutionResult } from 'did-resolver';
import * as atpDid from './atp-did';
export declare type DidResolverOptions = {
    timeout: number;
    plcUrl: string;
};
export declare class DidResolver {
    resolver: Resolver;
    constructor(opts?: Partial<DidResolverOptions>);
    resolveDid(did: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult>;
    ensureResolveDid(did: string, options?: DIDResolutionOptions): Promise<DIDDocument>;
    resolveAtpData(did: string): Promise<atpDid.AtpData>;
}
export declare const resolver: DidResolver;
