"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoarrInitialGlobalState = void 0;
const config_1 = require("../config");
const createNodeWriter_1 = require("./createNodeWriter");
const semver_compare_1 = __importDefault(require("semver-compare"));
const createRoarrInitialGlobalState = (currentState) => {
    const versions = (currentState.versions || []).concat();
    if (versions.length > 1) {
        versions.sort(semver_compare_1.default);
    }
    const currentIsLatestVersion = !versions.length ||
        (0, semver_compare_1.default)(config_1.ROARR_VERSION, versions[versions.length - 1]) === 1;
    if (!versions.includes(config_1.ROARR_VERSION)) {
        versions.push(config_1.ROARR_VERSION);
    }
    versions.sort(semver_compare_1.default);
    let newState = {
        onceLog: new Set(),
        sequence: 0,
        ...currentState,
        versions,
    };
    if (currentIsLatestVersion || !newState.write) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
            const AsyncLocalStorage = require('node:async_hooks').AsyncLocalStorage;
            const asyncLocalStorage = new AsyncLocalStorage();
            newState = {
                ...newState,
                asyncLocalStorage,
                write: (0, createNodeWriter_1.createNodeWriter)(),
            };
            // eslint-disable-next-line no-empty
        }
        catch (_a) { }
    }
    return newState;
};
exports.createRoarrInitialGlobalState = createRoarrInitialGlobalState;
//# sourceMappingURL=createRoarrInitialGlobalState.js.map