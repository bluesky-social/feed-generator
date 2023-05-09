"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlQueryCompiler = void 0;
const default_query_compiler_js_1 = require("../../query-compiler/default-query-compiler.js");
const ID_WRAP_REGEX = /`/g;
class MysqlQueryCompiler extends default_query_compiler_js_1.DefaultQueryCompiler {
    getCurrentParameterPlaceholder() {
        return '?';
    }
    getLeftExplainOptionsWrapper() {
        return '';
    }
    getExplainOptionAssignment() {
        return '=';
    }
    getExplainOptionsDelimiter() {
        return ' ';
    }
    getRightExplainOptionsWrapper() {
        return '';
    }
    getLeftIdentifierWrapper() {
        return '`';
    }
    getRightIdentifierWrapper() {
        return '`';
    }
    sanitizeIdentifier(identifier) {
        return identifier.replace(ID_WRAP_REGEX, '``');
    }
}
exports.MysqlQueryCompiler = MysqlQueryCompiler;
