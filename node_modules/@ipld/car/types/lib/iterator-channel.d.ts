/**
 * @template {any} T
 * @returns {IteratorChannel<T>}
 */
export function create<T extends unknown>(): import("./coding").IteratorChannel<T>;
export type IteratorChannel<T extends unknown> = import('./coding').IteratorChannel<T>;
//# sourceMappingURL=iterator-channel.d.ts.map