'use strict';

var chai = require('chai');
var bl = require('../lib/bl.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chai__default = /*#__PURE__*/_interopDefaultLegacy(chai);

const {assert} = chai__default["default"];
describe('Internal bytes list', () => {
  describe('push', () => {
    it('push bits', () => {
      const bl$1 = new bl.Bl(10);
      const expected = [];
      for (let i = 0; i < 25; i++) {
        bl$1.push([i + 1]);
        expected.push(i + 1);
      }
      assert.deepEqual([...bl$1.toBytes()], expected);
    });
    for (let i = 4; i < 21; i++) {
      it(`push Bl(${ i })`, () => {
        const bl$1 = new bl.Bl(i);
        const expected = [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          100,
          110,
          120,
          11,
          12,
          130,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23
        ];
        for (let i = 0; i < 5; i++) {
          bl$1.push([i + 1]);
        }
        bl$1.push(Uint8Array.from([
          6,
          7,
          8,
          9,
          10
        ]));
        bl$1.push([100]);
        bl$1.push(Uint8Array.from([
          110,
          120
        ]));
        bl$1.push(Uint8Array.from([
          11,
          12
        ]));
        bl$1.push([130]);
        bl$1.push(Uint8Array.from([
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23
        ]));
        assert.deepEqual([...bl$1.toBytes()], expected);
      });
    }
  });
});
