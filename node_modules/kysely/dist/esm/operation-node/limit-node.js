/// <reference types="./limit-node.d.ts" />
import { freeze } from '../util/object-utils.js';
import { ValueNode } from './value-node.js';
/**
 * @internal
 */
export const LimitNode = freeze({
    is(node) {
        return node.kind === 'LimitNode';
    },
    create(limit) {
        return freeze({
            kind: 'LimitNode',
            limit: ValueNode.create(limit),
        });
    },
});
