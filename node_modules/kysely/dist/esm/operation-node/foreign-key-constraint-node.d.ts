import { ColumnNode } from './column-node.js';
import { IdentifierNode } from './identifier-node.js';
import { OperationNode } from './operation-node.js';
import { OnModifyForeignAction, ReferencesNode } from './references-node.js';
import { TableNode } from './table-node.js';
export declare type ForeignKeyConstraintNodeProps = Omit<ForeignKeyConstraintNode, 'kind' | 'columns' | 'references'>;
export interface ForeignKeyConstraintNode extends OperationNode {
    readonly kind: 'ForeignKeyConstraintNode';
    readonly columns: ReadonlyArray<ColumnNode>;
    readonly references: ReferencesNode;
    readonly onDelete?: OnModifyForeignAction;
    readonly onUpdate?: OnModifyForeignAction;
    readonly name?: IdentifierNode;
}
/**
 * @internal
 */
export declare const ForeignKeyConstraintNode: Readonly<{
    is(node: OperationNode): node is ForeignKeyConstraintNode;
    create(sourceColumns: ReadonlyArray<ColumnNode>, targetTable: TableNode, targetColumns: ReadonlyArray<ColumnNode>, constraintName?: string): ForeignKeyConstraintNode;
    cloneWith(node: ForeignKeyConstraintNode, props: ForeignKeyConstraintNodeProps): Readonly<{
        name?: IdentifierNode | undefined;
        onDelete?: "no action" | "restrict" | "cascade" | "set null" | "set default" | undefined;
        onUpdate?: "no action" | "restrict" | "cascade" | "set null" | "set default" | undefined;
        kind: 'ForeignKeyConstraintNode';
        columns: ReadonlyArray<ColumnNode>;
        references: ReferencesNode;
    }>;
}>;
