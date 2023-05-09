import { ForeignKeyConstraintNode } from '../operation-node/foreign-key-constraint-node.js';
import { OperationNodeSource } from '../operation-node/operation-node-source.js';
import { OnModifyForeignAction } from '../operation-node/references-node.js';
export interface ForeignKeyConstraintBuilderInterface<R> {
    onDelete(onDelete: OnModifyForeignAction): R;
    onUpdate(onUpdate: OnModifyForeignAction): R;
}
export declare class ForeignKeyConstraintBuilder implements ForeignKeyConstraintBuilderInterface<ForeignKeyConstraintBuilder>, OperationNodeSource {
    #private;
    constructor(node: ForeignKeyConstraintNode);
    onDelete(onDelete: OnModifyForeignAction): ForeignKeyConstraintBuilder;
    onUpdate(onUpdate: OnModifyForeignAction): ForeignKeyConstraintBuilder;
    toOperationNode(): ForeignKeyConstraintNode;
}
