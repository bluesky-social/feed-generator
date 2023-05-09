export class Bl {
    /**
     * @param {number} [chunkSize]
     */
    constructor(chunkSize?: number | undefined);
    chunkSize: number;
    /** @type {number} */
    cursor: number;
    /** @type {number} */
    maxCursor: number;
    /** @type {(Uint8Array|number[])[]} */
    chunks: (Uint8Array | number[])[];
    /** @type {Uint8Array|number[]|null} */
    _initReuseChunk: Uint8Array | number[] | null;
    reset(): void;
    /**
     * @param {Uint8Array|number[]} bytes
     */
    push(bytes: Uint8Array | number[]): void;
    /**
     * @param {boolean} [reset]
     * @returns {Uint8Array}
     */
    toBytes(reset?: boolean | undefined): Uint8Array;
}
//# sourceMappingURL=bl.d.ts.map