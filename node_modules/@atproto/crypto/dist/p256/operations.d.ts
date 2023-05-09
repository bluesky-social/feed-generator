export declare const importKeypairJwk: (jwk: JsonWebKey, exportable?: boolean) => Promise<CryptoKeyPair>;
export declare const verifyDidSig: (did: string, data: Uint8Array, sig: Uint8Array) => Promise<boolean>;
export declare const verify: (publicKey: Uint8Array, data: Uint8Array, sig: Uint8Array) => Promise<boolean>;
export declare const importEcdsaPublicKey: (keyBytes: Uint8Array) => Promise<CryptoKey>;
