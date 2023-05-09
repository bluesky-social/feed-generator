import { OperationNode } from './operation-node.js';
import { ValueNode } from './value-node.js';
export interface OffsetNode extends OperationNode {
    readonly kind: 'OffsetNode';
    readonly offset: ValueNode;
}
/**
 * @internal
 */
export declare const OffsetNode: Readonly<{
    is(node: OperationNode): node is OffsetNode;
    create(offset: number): OffsetNode;
}>;
