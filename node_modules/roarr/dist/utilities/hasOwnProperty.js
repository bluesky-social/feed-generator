"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasOwnProperty = void 0;
/**
 * A stricter type guard.
 *
 * @see https://tsplay.dev/WK8zGw
 */
const hasOwnProperty = (object, property) => {
    return Object.prototype.hasOwnProperty.call(object, property);
};
exports.hasOwnProperty = hasOwnProperty;
//# sourceMappingURL=hasOwnProperty.js.map