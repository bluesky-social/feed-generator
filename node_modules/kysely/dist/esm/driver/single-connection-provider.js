/// <reference types="./single-connection-provider.d.ts" />
export class SingleConnectionProvider {
    #connection;
    #runningPromise;
    constructor(connection) {
        this.#connection = connection;
    }
    async provideConnection(consumer) {
        while (this.#runningPromise) {
            await this.#runningPromise;
        }
        const promise = this.#run(consumer);
        this.#runningPromise = promise
            .then(() => {
            this.#runningPromise = undefined;
        })
            .catch(() => {
            this.#runningPromise = undefined;
        });
        return promise;
    }
    // Run the runner in an async function to make sure it doesn't
    // throw synchronous errors.
    async #run(runner) {
        return await runner(this.#connection);
    }
}
