import { OperationNode } from './operation-node.js';
import { ColumnNode } from './column-node.js';
import { TableNode } from './table-node.js';
import { SelectAllNode } from './select-all-node.js';
export interface ReferenceNode extends OperationNode {
    readonly kind: 'ReferenceNode';
    readonly table: TableNode;
    readonly column: ColumnNode | SelectAllNode;
}
/**
 * @internal
 */
export declare const ReferenceNode: Readonly<{
    is(node: OperationNode): node is ReferenceNode;
    create(table: TableNode, column: ColumnNode): ReferenceNode;
    createSelectAll(table: TableNode): ReferenceNode;
}>;
