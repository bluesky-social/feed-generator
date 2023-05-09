"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenize = void 0;
const TokenRule = /(?:%(?<flag>([+0-]|-\+))?(?<width>\d+)?(?<position>\d+\$)?(?<precision>\.\d+)?(?<conversion>[%BCESb-iosux]))|(\\%)/g;
const tokenize = (subject) => {
    let matchResult;
    const tokens = [];
    let argumentIndex = 0;
    let lastIndex = 0;
    let lastToken = null;
    while ((matchResult = TokenRule.exec(subject)) !== null) {
        if (matchResult.index > lastIndex) {
            lastToken = {
                literal: subject.slice(lastIndex, matchResult.index),
                type: 'literal',
            };
            tokens.push(lastToken);
        }
        const match = matchResult[0];
        lastIndex = matchResult.index + match.length;
        if (match === '\\%' || match === '%%') {
            if (lastToken && lastToken.type === 'literal') {
                lastToken.literal += '%';
            }
            else {
                lastToken = {
                    literal: '%',
                    type: 'literal',
                };
                tokens.push(lastToken);
            }
        }
        else if (matchResult.groups) {
            lastToken = {
                conversion: matchResult.groups.conversion,
                flag: matchResult.groups.flag || null,
                placeholder: match,
                position: matchResult.groups.position ? Number.parseInt(matchResult.groups.position, 10) - 1 : argumentIndex++,
                precision: matchResult.groups.precision ? Number.parseInt(matchResult.groups.precision.slice(1), 10) : null,
                type: 'placeholder',
                width: matchResult.groups.width ? Number.parseInt(matchResult.groups.width, 10) : null,
            };
            tokens.push(lastToken);
        }
    }
    if (lastIndex <= subject.length - 1) {
        if (lastToken && lastToken.type === 'literal') {
            lastToken.literal += subject.slice(lastIndex);
        }
        else {
            tokens.push({
                literal: subject.slice(lastIndex),
                type: 'literal',
            });
        }
    }
    return tokens;
};
exports.tokenize = tokenize;
