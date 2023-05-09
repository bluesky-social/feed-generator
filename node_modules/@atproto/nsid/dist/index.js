"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  NSID: () => NSID
});
module.exports = __toCommonJS(src_exports);
var SEGMENT_RE = /^[a-zA-Z]([a-zA-Z0-9-])*$/;
var NSID = class {
  constructor(nsid) {
    this.segments = [];
    const segments = nsid.split(".");
    if (segments.length <= 2) {
      throw new Error(`Invalid NSID: ${nsid}`);
    }
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (SEGMENT_RE.test(segment)) {
        continue;
      }
      if (i === segments.length - 1 && segment === "*") {
        continue;
      }
      throw new Error(`Invalid NSID: invalid character in segment "${segment}"`);
    }
    this.segments = segments;
  }
  static parse(nsid) {
    return new NSID(nsid);
  }
  static create(authority, name) {
    const segments = [...authority.split(".").reverse(), name].join(".");
    return new NSID(segments);
  }
  static isValid(nsid) {
    try {
      NSID.parse(nsid);
      return true;
    } catch (e) {
      return false;
    }
  }
  get authority() {
    return this.segments.slice(0, this.segments.length - 1).reverse().join(".");
  }
  get name() {
    return this.segments.at(this.segments.length - 1);
  }
  toString() {
    return this.segments.join(".");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NSID
});
//# sourceMappingURL=index.js.map
