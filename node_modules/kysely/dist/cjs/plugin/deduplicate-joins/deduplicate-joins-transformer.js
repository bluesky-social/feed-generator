"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeduplicateJoinsTransformer = void 0;
const operation_node_transformer_js_1 = require("../../operation-node/operation-node-transformer.js");
const object_utils_js_1 = require("../../util/object-utils.js");
class DeduplicateJoinsTransformer extends operation_node_transformer_js_1.OperationNodeTransformer {
    transformSelectQuery(node) {
        return this.#transformQuery(super.transformSelectQuery(node));
    }
    transformUpdateQuery(node) {
        return this.#transformQuery(super.transformUpdateQuery(node));
    }
    transformDeleteQuery(node) {
        return this.#transformQuery(super.transformDeleteQuery(node));
    }
    #transformQuery(node) {
        if (!node.joins || node.joins.length === 0) {
            return node;
        }
        return (0, object_utils_js_1.freeze)({
            ...node,
            joins: this.#deduplicateJoins(node.joins),
        });
    }
    #deduplicateJoins(joins) {
        const out = [];
        for (let i = 0; i < joins.length; ++i) {
            let foundDuplicate = false;
            for (let j = i + 1; j < joins.length; ++j) {
                if ((0, object_utils_js_1.compare)(joins[i], joins[j])) {
                    foundDuplicate = true;
                    break;
                }
            }
            if (!foundDuplicate) {
                out.push(joins[i]);
            }
        }
        return (0, object_utils_js_1.freeze)(out);
    }
}
exports.DeduplicateJoinsTransformer = DeduplicateJoinsTransformer;
