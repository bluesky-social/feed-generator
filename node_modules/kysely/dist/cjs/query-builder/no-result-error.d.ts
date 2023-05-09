import { QueryNode } from '../operation-node/query-node.js';
export declare type NoResultErrorConstructor = new (node: QueryNode) => Error;
export declare class NoResultError extends Error {
    /**
     * The operation node tree of the query that was executed.
     */
    readonly node: QueryNode;
    constructor(node: QueryNode);
}
