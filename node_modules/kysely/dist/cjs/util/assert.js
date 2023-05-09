"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIsString = exports.assertNotNullOrUndefined = void 0;
function assertNotNullOrUndefined(value) {
    if (value === null || value === undefined) {
        throw new Error(`${value} must not be null or undefined`);
    }
}
exports.assertNotNullOrUndefined = assertNotNullOrUndefined;
function assertIsString(value) {
    if (typeof value !== 'string') {
        throw new Error(`${value} must be a string`);
    }
}
exports.assertIsString = assertIsString;
