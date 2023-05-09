"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printf = exports.createPrintf = void 0;
const createPrintf_1 = require("./createPrintf");
Object.defineProperty(exports, "createPrintf", { enumerable: true, get: function () { return createPrintf_1.createPrintf; } });
exports.printf = createPrintf_1.createPrintf();
