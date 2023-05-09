"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOperationNodeSource = void 0;
const object_utils_js_1 = require("../util/object-utils.js");
function isOperationNodeSource(obj) {
    return (0, object_utils_js_1.isObject)(obj) && (0, object_utils_js_1.isFunction)(obj.toOperationNode);
}
exports.isOperationNodeSource = isOperationNodeSource;
