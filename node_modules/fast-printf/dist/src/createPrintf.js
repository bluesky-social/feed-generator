"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrintf = void 0;
const boolean_1 = require("boolean");
const tokenize_1 = require("./tokenize");
const formatDefaultUnboundExpression = (
// @ts-expect-error unused parameter
subject, token) => {
    return token.placeholder;
};
const createPrintf = (configuration) => {
    var _a;
    const padValue = (value, width, flag) => {
        if (flag === '-') {
            return value.padEnd(width, ' ');
        }
        else if (flag === '-+') {
            return ((Number(value) >= 0 ? '+' : '') + value).padEnd(width, ' ');
        }
        else if (flag === '+') {
            return ((Number(value) >= 0 ? '+' : '') + value).padStart(width, ' ');
        }
        else if (flag === '0') {
            return value.padStart(width, '0');
        }
        else {
            return value.padStart(width, ' ');
        }
    };
    const formatUnboundExpression = (_a = configuration === null || configuration === void 0 ? void 0 : configuration.formatUnboundExpression) !== null && _a !== void 0 ? _a : formatDefaultUnboundExpression;
    const cache = {};
    // eslint-disable-next-line complexity
    return (subject, ...boundValues) => {
        let tokens = cache[subject];
        if (!tokens) {
            tokens = cache[subject] = tokenize_1.tokenize(subject);
        }
        let result = '';
        for (const token of tokens) {
            if (token.type === 'literal') {
                result += token.literal;
            }
            else {
                let boundValue = boundValues[token.position];
                if (boundValue === undefined) {
                    result += formatUnboundExpression(subject, token, boundValues);
                }
                else if (token.conversion === 'b') {
                    result += boolean_1.boolean(boundValue) ? 'true' : 'false';
                }
                else if (token.conversion === 'B') {
                    result += boolean_1.boolean(boundValue) ? 'TRUE' : 'FALSE';
                }
                else if (token.conversion === 'c') {
                    result += boundValue;
                }
                else if (token.conversion === 'C') {
                    result += String(boundValue).toUpperCase();
                }
                else if (token.conversion === 'i' || token.conversion === 'd') {
                    boundValue = String(Math.trunc(boundValue));
                    if (token.width !== null) {
                        boundValue = padValue(boundValue, token.width, token.flag);
                    }
                    result += boundValue;
                }
                else if (token.conversion === 'e') {
                    result += Number(boundValue)
                        .toExponential();
                }
                else if (token.conversion === 'E') {
                    result += Number(boundValue)
                        .toExponential()
                        .toUpperCase();
                }
                else if (token.conversion === 'f') {
                    if (token.precision !== null) {
                        boundValue = Number(boundValue).toFixed(token.precision);
                    }
                    if (token.width !== null) {
                        boundValue = padValue(String(boundValue), token.width, token.flag);
                    }
                    result += boundValue;
                }
                else if (token.conversion === 'o') {
                    result += (Number.parseInt(String(boundValue), 10) >>> 0).toString(8);
                }
                else if (token.conversion === 's') {
                    if (token.width !== null) {
                        boundValue = padValue(String(boundValue), token.width, token.flag);
                    }
                    result += boundValue;
                }
                else if (token.conversion === 'S') {
                    if (token.width !== null) {
                        boundValue = padValue(String(boundValue), token.width, token.flag);
                    }
                    result += String(boundValue).toUpperCase();
                }
                else if (token.conversion === 'u') {
                    result += Number.parseInt(String(boundValue), 10) >>> 0;
                }
                else if (token.conversion === 'x') {
                    boundValue = (Number.parseInt(String(boundValue), 10) >>> 0).toString(16);
                    if (token.width !== null) {
                        boundValue = padValue(String(boundValue), token.width, token.flag);
                    }
                    result += boundValue;
                }
                else {
                    throw new Error('Unknown format specifier.');
                }
            }
        }
        return result;
    };
};
exports.createPrintf = createPrintf;
