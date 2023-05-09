"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderByItemNode = void 0;
const object_utils_js_1 = require("../util/object-utils.js");
/**
 * @internal
 */
exports.OrderByItemNode = (0, object_utils_js_1.freeze)({
    is(node) {
        return node.kind === 'OrderByItemNode';
    },
    create(orderBy, direction) {
        return (0, object_utils_js_1.freeze)({
            kind: 'OrderByItemNode',
            orderBy,
            direction,
        });
    },
});
