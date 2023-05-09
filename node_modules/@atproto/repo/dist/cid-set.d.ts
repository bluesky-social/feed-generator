import { CID } from 'multiformats';
export declare class CidSet {
    private set;
    constructor(arr?: CID[]);
    add(cid: CID): CidSet;
    addSet(toMerge: CidSet): CidSet;
    subtractSet(toSubtract: CidSet): CidSet;
    delete(cid: CID): this;
    has(cid: CID): boolean;
    size(): number;
    clear(): CidSet;
    toList(): CID[];
}
export default CidSet;
