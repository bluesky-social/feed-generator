"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpTerminator = void 0;
const createInternalHttpTerminator_1 = require("./createInternalHttpTerminator");
const createHttpTerminator = (configurationInput) => {
    const httpTerminator = (0, createInternalHttpTerminator_1.createInternalHttpTerminator)(configurationInput);
    return {
        terminate: httpTerminator.terminate,
    };
};
exports.createHttpTerminator = createHttpTerminator;
