"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataTypeNode = void 0;
const object_utils_js_1 = require("../util/object-utils.js");
/**
 * @internal
 */
exports.DataTypeNode = (0, object_utils_js_1.freeze)({
    is(node) {
        return node.kind === 'DataTypeNode';
    },
    create(dataType) {
        return (0, object_utils_js_1.freeze)({
            kind: 'DataTypeNode',
            dataType,
        });
    },
});
