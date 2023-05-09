"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockLogger = void 0;
const constants_1 = require("../constants");
const createChildLogger = (log, logLevel) => {
    return (a, b, c, d, e, f, g, h, index, index_) => {
        log.child({
            logLevel,
        })(a, b, c, d, e, f, g, h, index, index_);
    };
};
const createMockLogger = (onMessage, parentContext) => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const log = () => {
        return undefined;
    };
    log.adopt = async (routine) => {
        return routine();
    };
    log.child = () => {
        return (0, exports.createMockLogger)(onMessage, parentContext);
    };
    log.getContext = () => {
        return {};
    };
    log.debug = createChildLogger(log, constants_1.logLevels.debug);
    log.debugOnce = createChildLogger(log, constants_1.logLevels.debug);
    log.error = createChildLogger(log, constants_1.logLevels.error);
    log.errorOnce = createChildLogger(log, constants_1.logLevels.error);
    log.fatal = createChildLogger(log, constants_1.logLevels.fatal);
    log.fatalOnce = createChildLogger(log, constants_1.logLevels.fatal);
    log.info = createChildLogger(log, constants_1.logLevels.info);
    log.infoOnce = createChildLogger(log, constants_1.logLevels.info);
    log.trace = createChildLogger(log, constants_1.logLevels.trace);
    log.traceOnce = createChildLogger(log, constants_1.logLevels.trace);
    log.warn = createChildLogger(log, constants_1.logLevels.warn);
    log.warnOnce = createChildLogger(log, constants_1.logLevels.warn);
    return log;
};
exports.createMockLogger = createMockLogger;
//# sourceMappingURL=createMockLogger.js.map