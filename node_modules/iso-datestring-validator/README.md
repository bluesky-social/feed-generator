# iso-datestring-validator

## What is it

A simple package for validating strings denoting dates and time, including ISO 8601 format. The package provides the following functions:

1. **Date validation**. YYYY-MM-DD format from 0001-01-01 to 9999-12-31, leap year friendly. Custom digit separators and null separators supported: YYYY/MM/DD or YYYYMMDD is no problem.

2. **Time validation**. HH:mm:ss.fff±hh:mm format, seconds, fractions of seconds and timezone offset being optional. Custom digit separators supported for HHmmss as well (no custom separator for fractions, it is dot).

**Caveat**: do not use '-' and '+' as separators when validating time with timezone. I am reluctant to fix this unless it is an issue.

```js
isValidTime('14-45-15.000+00-00', '-', true);
// will yield wrong result
```

3. **Year-month validation**.

4. **ISO 8601 datestring validation** with timezones, with and without separators:

- 2019-07-09T15:03:36.000+00:00
- 2019-07-09T15:03:36Z
- 20190709T150336Z

## Installation

```js
npm i --save iso-datestring-validator
```

or

```js
yarn add iso-datestring-validator
```

## Import

```ts
import * as isoDatestringValidator from 'iso-datestring-validator';
```

alternatively you can import the function that you need separately:

```ts
import {
  isValidDate,
  isValidISODateString,
  isValidTime,
  isValidYearMonth,
} from 'iso-datestring-validator';
```

## Usage

### Date validation

Pass a **YYYY-MM-DD** date string to the **isValidDate** function to check it. To validate dates that use a custom digit separator, pass it as the second argument.

```ts
import { isValidDate } from 'iso-datestring-validator';

isValidDate('2019-01-31');
// true

isValidDate('20190131');
// false, no custom digit separator provided, hyphen separator not found in the string

isValidDate('20190131', '');
// true

isValidDate('2019/01/31', '/');
// true
```

### Time validation

Time string in HH:mm:ss.fff±hh:mm format can be validated with the **isValidTime** function. Seconds and fractions are optional. However, if using fractions min number of numbers is 1 and max is 9. Zone offset is optional as well, its check is switched off by default.

```ts
import { isValidTime } from 'iso-datestring-validator';

isValidTime('13:00');
// true

isValidTime('13:00:00');
// true

isValidTime('13:00:00.000000000');
// true

// pass time, separator and boolean flag to enable zone offset check
isValidTime('14:45:15.000+00:00', ':', true);
// true

// you can take advantage of default separator if you pass undefined as second param
isValidTime('14:45:15.000+00:00', undefined, true);
// true

isValidTime('144515.000Z', '', true);
// true
```

### Year and month validation

These are validated by the **isValidYearMonth** function. Rules same as in the previous case: a string **YYYY-MM** and a custom digit separator if required.

```ts
import { isValidYearMonth } from 'iso-datestring-validator';

isValidYearMonth('2019/01', '/');
// true

isValidYearMonth('2019-01');
// true
```

### ISO 8601 datestring validation

Pass a string to **isValidISODateString** to see if it is valid.

```ts
import { isValidISODateString } from 'iso-datestring-validator';

isValidISODateString('2019-07-09T15:03:36.000+00:00');
// true

isValidISODateString('20190709T150336Z');
// true
```

That's all about this package. Have fun, feel free to contribute with some test :]

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/bwca)
