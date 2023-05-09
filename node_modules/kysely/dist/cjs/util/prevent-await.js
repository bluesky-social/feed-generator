"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventAwait = void 0;
function preventAwait(clazz, message) {
    Object.defineProperties(clazz.prototype, {
        then: {
            enumerable: false,
            value: () => {
                throw new Error(message);
            },
        },
    });
}
exports.preventAwait = preventAwait;
