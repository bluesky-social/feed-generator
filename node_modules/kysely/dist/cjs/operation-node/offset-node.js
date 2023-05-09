"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetNode = void 0;
const object_utils_js_1 = require("../util/object-utils.js");
const value_node_js_1 = require("./value-node.js");
/**
 * @internal
 */
exports.OffsetNode = (0, object_utils_js_1.freeze)({
    is(node) {
        return node.kind === 'OffsetNode';
    },
    create(offset) {
        return (0, object_utils_js_1.freeze)({
            kind: 'OffsetNode',
            offset: value_node_js_1.ValueNode.create(offset),
        });
    },
});
