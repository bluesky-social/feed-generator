/// <reference types="./prevent-await.d.ts" />
export function preventAwait(clazz, message) {
    Object.defineProperties(clazz.prototype, {
        then: {
            enumerable: false,
            value: () => {
                throw new Error(message);
            },
        },
    });
}
