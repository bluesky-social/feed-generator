# fast-printf

[![Travis build status](http://img.shields.io/travis/gajus/fast-printf/master.svg?style=flat-square)](https://travis-ci.org/gajus/fast-printf)
[![Coveralls](https://img.shields.io/coveralls/gajus/fast-printf.svg?style=flat-square)](https://coveralls.io/github/gajus/fast-printf)
[![NPM version](http://img.shields.io/npm/v/fast-printf.svg?style=flat-square)](https://www.npmjs.org/package/fast-printf)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

[Fast](#benchmark) and spec-compliant `printf` implementation for Node.js and browser.

* [Usage](#usage)
* [Handling Unbound Value References](#handling-unbound-value-references)
* [Benchmark](#benchmark)
* [Printf Cheatsheet](#printf-cheatsheet)

## Usage

```ts
import {
  printf,
} from 'fast-printf';

console.log(printf('foo %s', 'bar'));

```

## Handling Unbound Value References

By default, interpolating an unbound expression produces:

* The expression is left in place
* A warning is logged using [roarr](https://github.com/gajus/roarr)

i.e. `printf('%s bar')` produces `%s bar`.

This behavior can be overridden by configuring a `fast-printf` instance using `createPrintf`:

```ts
import {
  createPrintf,
} from 'fast-printf';

const printf = createPrintf({
  formatUnboundExpression: (
    subject: string,
    token: PlaceholderToken,
    boundValues: any[],
  ): string => {
    console.warn({
      boundValues,
      position: token.position,
      subject,
    }, 'referenced unbound value');

    return token.placeholder;
  };
});

console.log(printf('foo %s', 'bar'));

```

## Benchmark

|**implementation**|**without_placeholders**|**with_string_placeholder**|**with_many_string_placeholders**|
|-|-|-|-|
|[`sprintf`](https://github.com/alexei/sprintf.js)|31,772,029|4,154,748|637,229|
|[`printf`](https://github.com/adaltas/node-printf)|651,970|373,615|160,795|
|[`fast-printf`](https://github.com/gajus/fast-printf)|78,068,540|11,820,632|2,552,386|

Results show operations per second (greater is better).

To run the benchmark yourself please see [`./benchmark`](./benchmark).

## Printf Cheatsheet

```ts
// %c character
printf('%c', 'b');
// => 'c'

// %C converts to uppercase character (if not already)
printf('%C', 'b');
// => 'B'

// %d decimal integer (base 10)
printf('%d', 100);
// => '100'

// %0Xd zero-fill for X digits
printf('%05d', 1);
// => '00001'

// %Xd right justify for X digits
printf('%5d', 1);
// => '    1'

// %-Xd left justify for X digits
printf('%-5d', 1);
// => '1    '

// %+d adds plus sign(+) to positive integers, minus sign for negative integers(-)
printf('%+5d', 1);
// => '    +1'
printf('%+5d', -1);
// => '    -1'

// %e scientific notation
printf('%e', 52.8);
// => '5.28e+1'

// %E scientific notation with a capital 'E'
printf('%E', 52.8);
// => '5.28E+1'

// %f floating-point number
printf('%f', 52.8);
// => '52.8'

// %.Yf prints Y positions after decimal
printf('%.1f', 1.234);
// => '1.2'

// %Xf takes up X spaces
printf('%5f', 123);
// => '  123'

// %0X.Yf zero-fills
printf('%05.1f', 1.234);
// => '001.2'

// %-X.Yf left justifies
printf('%-5.1f', 1.234);
// => '1.2  '

// %i integer (base 10)
printf('%i', 123);
// => '123'

// %b converts to boolean
printf('%b', true);
// => 'true'
printf('%b', 'true');
// => 'true'
printf('%b', 1);
// => 'true'

// %B converts to uppercase boolean
printf('%b', true);
// => 'TRUE'
printf('%b', 'true');
// => 'TRUE'
printf('%b', 1);
// => 'TRUE'

// %o octal number (base 8)
printf('%o', 8);
// => '10'

// %s a string of characters
printf('%s', 'foo');
// => 'foo'

// %Xs formats string for a minimum of X spaces
printf('%5s', 'foo');
// => '  foo'

// %-Xs left justify
printf('%-5s', 'foo');
// => 'foo  '

// %S converts to a string of uppercase characters (if not already)
printf('%S', 'foo');
// => 'FOO'

// %u unsigned decimal integer
printf('%u', 1);
// => '1'
printf('%u', -1);
// => '4294967295'

// %x number in hexadecimal (base 16)
printf('%x', 255);
// => 'ff'

// %% prints a percent sign
printf('%%');
// => '%'

// \% prints a percent sign
printf('\\%');
// => '%'

// %2$s %1$s positional arguments
printf('%2$s %1$s', 'bar', 'foo');
// => 'foo bar'

```
