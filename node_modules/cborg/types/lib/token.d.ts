export class Type {
    /**
     * @param {number} major
     * @param {string} name
     * @param {boolean} terminal
     */
    constructor(major: number, name: string, terminal: boolean);
    major: number;
    majorEncoded: number;
    name: string;
    terminal: boolean;
    toString(): string;
    /**
     * @param {Type} typ
     * @returns {number}
     */
    compare(typ: Type): number;
}
export namespace Type {
    export const uint: Type;
    export const negint: Type;
    export const bytes: Type;
    export const string: Type;
    export const array: Type;
    export const map: Type;
    export const tag: Type;
    export const float: Type;
    const _false: Type;
    export { _false as false };
    const _true: Type;
    export { _true as true };
    const _null: Type;
    export { _null as null };
    export const undefined: Type;
    const _break: Type;
    export { _break as break };
}
export class Token {
    /**
     * @param {Type} type
     * @param {any} [value]
     * @param {number} [encodedLength]
     */
    constructor(type: Type, value?: any, encodedLength?: number | undefined);
    type: Type;
    value: any;
    encodedLength: number | undefined;
    /** @type {Uint8Array|undefined} */
    encodedBytes: Uint8Array | undefined;
    /** @type {Uint8Array|undefined} */
    byteValue: Uint8Array | undefined;
    toString(): string;
}
//# sourceMappingURL=token.d.ts.map