# p-wait-for

> Wait for a condition to be true

Can be useful for polling.

## Install

```
$ npm install p-wait-for
```

## Usage

```js
const pWaitFor = require('p-wait-for');
const pathExists = require('path-exists');

(async () => {
	await pWaitFor(() => pathExists('unicorn.png'));
	console.log('Yay! The file now exists.');
})();
```

## API

### pWaitFor(condition, options?)

Returns a `Promise` that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

#### condition

Type: `Function`

Expected to return `Promise<boolean> | boolean`.

#### options

Type: `object`

##### interval

Type: `number`\
Default: `20`

Number of milliseconds to wait before retrying `condition`.

##### timeout

Type: `number`\
Default: `Infinity`

Number of milliseconds to wait before automatically rejecting.

##### leadingCheck

Type: `boolean`\
Default: `true`

Whether to run the check immediately rather than starting by waiting `interval` milliseconds.

Useful for when the check, if run immediately, would likely return `false`. In this scenario, set `leadingCheck` to `false`.

## Related

- [p-whilst](https://github.com/sindresorhus/p-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise
- [More…](https://github.com/sindresorhus/promise-fun)
