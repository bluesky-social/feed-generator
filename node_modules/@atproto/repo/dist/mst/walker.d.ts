import { MST, NodeEntry } from './mst';
declare type WalkerStatusDone = {
    done: true;
};
declare type WalkerStatusProgress = {
    done: false;
    curr: NodeEntry;
    walking: MST | null;
    index: number;
};
declare type WalkerStatus = WalkerStatusDone | WalkerStatusProgress;
export declare class MstWalker {
    root: MST;
    stack: WalkerStatus[];
    status: WalkerStatus;
    constructor(root: MST);
    layer(): number;
    stepOver(): Promise<void>;
    stepInto(): Promise<void>;
    advance(): Promise<void>;
}
export default MstWalker;
