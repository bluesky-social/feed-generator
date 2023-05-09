"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDataTypeExpression = void 0;
const data_type_node_js_1 = require("../operation-node/data-type-node.js");
const operation_node_source_js_1 = require("../operation-node/operation-node-source.js");
function parseDataTypeExpression(dataType) {
    return (0, operation_node_source_js_1.isOperationNodeSource)(dataType)
        ? dataType.toOperationNode()
        : data_type_node_js_1.DataTypeNode.create(dataType);
}
exports.parseDataTypeExpression = parseDataTypeExpression;
