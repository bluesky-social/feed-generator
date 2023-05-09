"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoarrInitialGlobalStateBrowser = void 0;
const config_1 = require("../config");
const semver_compare_1 = __importDefault(require("semver-compare"));
const createRoarrInitialGlobalStateBrowser = (currentState) => {
    const versions = (currentState.versions || []).concat();
    if (versions.length > 1) {
        versions.sort(semver_compare_1.default);
    }
    if (!versions.includes(config_1.ROARR_VERSION)) {
        versions.push(config_1.ROARR_VERSION);
    }
    versions.sort(semver_compare_1.default);
    return {
        sequence: 0,
        ...currentState,
        versions,
    };
};
exports.createRoarrInitialGlobalStateBrowser = createRoarrInitialGlobalStateBrowser;
//# sourceMappingURL=createRoarrInitialGlobalStateBrowser.js.map