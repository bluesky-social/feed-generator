"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const tokenize_1 = require("../../src/tokenize");
ava_1.default('tokenizes a string without placeholders', (t) => {
    t.deepEqual(tokenize_1.tokenize('foo bar'), [
        {
            literal: 'foo bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string with placeholders (%%)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%%'), [
        {
            literal: '%',
            type: 'literal',
        },
    ]);
    t.deepEqual(tokenize_1.tokenize('foo %% bar'), [
        {
            literal: 'foo % bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string with placeholders (%%s)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%%s'), [
        {
            literal: '%s',
            type: 'literal',
        },
    ]);
    t.deepEqual(tokenize_1.tokenize('foo %%s bar'), [
        {
            literal: 'foo %s bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string with placeholders (\\%)', (t) => {
    t.deepEqual(tokenize_1.tokenize('foo \\% bar'), [
        {
            literal: 'foo % bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string with a placeholder', (t) => {
    t.deepEqual(tokenize_1.tokenize('foo %s bar'), [
        {
            literal: 'foo ',
            type: 'literal',
        },
        {
            conversion: 's',
            flag: null,
            placeholder: '%s',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: null,
        },
        {
            literal: ' bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string with multiple placeholders', (t) => {
    t.deepEqual(tokenize_1.tokenize('foo %s %s bar'), [
        {
            literal: 'foo ',
            type: 'literal',
        },
        {
            conversion: 's',
            flag: null,
            placeholder: '%s',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: null,
        },
        {
            literal: ' ',
            type: 'literal',
        },
        {
            conversion: 's',
            flag: null,
            placeholder: '%s',
            position: 1,
            precision: null,
            type: 'placeholder',
            width: null,
        },
        {
            literal: ' bar',
            type: 'literal',
        },
    ]);
});
ava_1.default('tokenizes a string containing only a placeholder', (t) => {
    t.deepEqual(tokenize_1.tokenize('%s'), [
        {
            conversion: 's',
            flag: null,
            placeholder: '%s',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: null,
        },
    ]);
});
ava_1.default('identifies flag (%+d)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%+d'), [
        {
            conversion: 'd',
            flag: '+',
            placeholder: '%+d',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: null,
        },
    ]);
});
ava_1.default('identifies width (%1d)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%1d'), [
        {
            conversion: 'd',
            flag: null,
            placeholder: '%1d',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: 1,
        },
    ]);
});
ava_1.default('identifies precision (%.1f)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%.1f'), [
        {
            conversion: 'f',
            flag: null,
            placeholder: '%.1f',
            position: 0,
            precision: 1,
            type: 'placeholder',
            width: null,
        },
    ]);
});
ava_1.default('tokenizes positional arguments (%2$s %1$s)', (t) => {
    t.deepEqual(tokenize_1.tokenize('%2$s %1$s'), [
        {
            conversion: 's',
            flag: null,
            placeholder: '%2$s',
            position: 1,
            precision: null,
            type: 'placeholder',
            width: null,
        },
        {
            literal: ' ',
            type: 'literal',
        },
        {
            conversion: 's',
            flag: null,
            placeholder: '%1$s',
            position: 0,
            precision: null,
            type: 'placeholder',
            width: null,
        },
    ]);
});
