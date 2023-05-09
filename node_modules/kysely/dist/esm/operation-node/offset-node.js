/// <reference types="./offset-node.d.ts" />
import { freeze } from '../util/object-utils.js';
import { ValueNode } from './value-node.js';
/**
 * @internal
 */
export const OffsetNode = freeze({
    is(node) {
        return node.kind === 'OffsetNode';
    },
    create(offset) {
        return freeze({
            kind: 'OffsetNode',
            offset: ValueNode.create(offset),
        });
    },
});
