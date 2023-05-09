/// <reference types="./data-type-parser.d.ts" />
import { DataTypeNode, } from '../operation-node/data-type-node.js';
import { isOperationNodeSource } from '../operation-node/operation-node-source.js';
export function parseDataTypeExpression(dataType) {
    return isOperationNodeSource(dataType)
        ? dataType.toOperationNode()
        : DataTypeNode.create(dataType);
}
