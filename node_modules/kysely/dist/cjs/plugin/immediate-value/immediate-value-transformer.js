"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmediateValueTransformer = void 0;
const operation_node_transformer_js_1 = require("../../operation-node/operation-node-transformer.js");
/**
 * Transforms all ValueNodes to immediate.
 *
 * WARNING! This should never be part of the public API. Users should never use this.
 * This is an internal helper.
 *
 * @internal
 */
class ImmediateValueTransformer extends operation_node_transformer_js_1.OperationNodeTransformer {
    transformValue(node) {
        return {
            ...super.transformValue(node),
            immediate: true,
        };
    }
}
exports.ImmediateValueTransformer = ImmediateValueTransformer;
