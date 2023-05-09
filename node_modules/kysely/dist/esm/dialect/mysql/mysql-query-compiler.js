/// <reference types="./mysql-query-compiler.d.ts" />
import { DefaultQueryCompiler } from '../../query-compiler/default-query-compiler.js';
const ID_WRAP_REGEX = /`/g;
export class MysqlQueryCompiler extends DefaultQueryCompiler {
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
