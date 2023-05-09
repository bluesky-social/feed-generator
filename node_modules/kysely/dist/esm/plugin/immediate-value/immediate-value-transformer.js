/// <reference types="./immediate-value-transformer.d.ts" />
import { OperationNodeTransformer } from '../../operation-node/operation-node-transformer.js';
/**
 * Transforms all ValueNodes to immediate.
 *
 * WARNING! This should never be part of the public API. Users should never use this.
 * This is an internal helper.
 *
 * @internal
 */
export class ImmediateValueTransformer extends OperationNodeTransformer {
    transformValue(node) {
        return {
            ...super.transformValue(node),
            immediate: true,
        };
    }
}
