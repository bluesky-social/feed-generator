"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogLevelName = void 0;
const getLogLevelName = (numericLogLevel) => {
    if (numericLogLevel <= 10) {
        return 'trace';
    }
    if (numericLogLevel <= 20) {
        return 'debug';
    }
    if (numericLogLevel <= 30) {
        return 'info';
    }
    if (numericLogLevel <= 40) {
        return 'warn';
    }
    if (numericLogLevel <= 50) {
        return 'error';
    }
    return 'fatal';
};
exports.getLogLevelName = getLogLevelName;
//# sourceMappingURL=getLogLevelName.js.map