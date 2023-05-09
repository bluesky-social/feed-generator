import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js';
import { OperationNode } from '../../operation-node/operation-node.js';
import { ReferencesNode } from '../../operation-node/references-node.js';
import { SchemableIdentifierNode } from '../../operation-node/schemable-identifier-node.js';
export declare class WithSchemaTransformer extends OperationNodeTransformer {
    #private;
    constructor(schema: string);
    protected transformNodeImpl<T extends OperationNode>(node: T): T;
    protected transformSchemableIdentifier(node: SchemableIdentifierNode): SchemableIdentifierNode;
    protected transformReferences(node: ReferencesNode): ReferencesNode;
}
