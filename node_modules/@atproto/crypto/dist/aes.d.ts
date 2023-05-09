export declare class AesKey {
    private key;
    constructor(key: CryptoKey);
    static create(): Promise<AesKey>;
    encrypt(data: string): Promise<string>;
    decrypt(data: string): Promise<string>;
}
export default AesKey;
