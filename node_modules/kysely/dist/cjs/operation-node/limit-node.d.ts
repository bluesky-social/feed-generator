import { OperationNode } from './operation-node.js';
import { ValueNode } from './value-node.js';
export interface LimitNode extends OperationNode {
    readonly kind: 'LimitNode';
    readonly limit: ValueNode;
}
/**
 * @internal
 */
export declare const LimitNode: Readonly<{
    is(node: OperationNode): node is LimitNode;
    create(limit: number): LimitNode;
}>;
