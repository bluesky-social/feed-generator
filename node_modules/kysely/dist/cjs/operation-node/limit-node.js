"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitNode = void 0;
const object_utils_js_1 = require("../util/object-utils.js");
const value_node_js_1 = require("./value-node.js");
/**
 * @internal
 */
exports.LimitNode = (0, object_utils_js_1.freeze)({
    is(node) {
        return node.kind === 'LimitNode';
    },
    create(limit) {
        return (0, object_utils_js_1.freeze)({
            kind: 'LimitNode',
            limit: value_node_js_1.ValueNode.create(limit),
        });
    },
});
