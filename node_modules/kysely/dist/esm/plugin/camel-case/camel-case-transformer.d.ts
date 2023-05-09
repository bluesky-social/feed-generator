import { IdentifierNode } from '../../operation-node/identifier-node.js';
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js';
import { StringMapper } from './camel-case.js';
export declare class SnakeCaseTransformer extends OperationNodeTransformer {
    #private;
    constructor(snakeCase: StringMapper);
    protected transformIdentifier(node: IdentifierNode): IdentifierNode;
}
