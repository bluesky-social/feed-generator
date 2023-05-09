'use strict';

var process = require('process');
require('../cborg.js');
var diagnostic = require('./diagnostic.js');
var byteUtils = require('./byte-utils.js');
var encode = require('./encode.js');
var decode = require('./decode.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var process__default = /*#__PURE__*/_interopDefaultLegacy(process);

function usage(code) {
  console.error('Usage: cborg <command> <args>');
  console.error('Valid commands:');
  console.error('\tbin2diag [binary input]');
  console.error('\tbin2hex [binary input]');
  console.error('\tbin2json [--pretty] [binary input]');
  console.error('\tdiag2bin [diagnostic input]');
  console.error('\tdiag2hex [diagnostic input]');
  console.error('\tdiag2json [--pretty] [diagnostic input]');
  console.error('\thex2bin [hex input]');
  console.error('\thex2diag [hex input]');
  console.error('\thex2json [--pretty] [hex input]');
  console.error('\tjson2bin \'[json input]\'');
  console.error('\tjson2diag \'[json input]\'');
  console.error('\tjson2hex \'[json input]\'');
  console.error('Input may either be supplied as an argument or piped via stdin');
  process__default["default"].exit(code || 0);
}
async function fromStdin() {
  const chunks = [];
  for await (const chunk of process__default["default"].stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function fromHex(str) {
  str = str.replace(/\r?\n/g, '');
  if (!/^([0-9a-f]{2})*$/i.test(str)) {
    throw new Error('Input string is not hexadecimal format');
  }
  return byteUtils.fromHex(str);
}
function argvPretty() {
  const argv = process__default["default"].argv.filter(s => s !== '--pretty');
  const pretty = argv.length !== process__default["default"].argv.length;
  return {
    argv,
    pretty
  };
}
async function run() {
  const cmd = process__default["default"].argv[2];
  switch (cmd) {
  case 'help': {
      return usage(0);
    }
  case 'bin2diag': {
      const bin = process__default["default"].argv.length < 4 ? await fromStdin() : new TextEncoder().encode(process__default["default"].argv[3]);
      for (const line of diagnostic.tokensToDiagnostic(bin)) {
        console.log(line);
      }
      return;
    }
  case 'bin2hex': {
      const bin = process__default["default"].argv.length < 4 ? await fromStdin() : new TextEncoder().encode(process__default["default"].argv[3]);
      return console.log(byteUtils.toHex(bin));
    }
  case 'bin2json': {
      const {argv, pretty} = argvPretty();
      const bin = argv.length < 4 ? await fromStdin() : new TextEncoder().encode(argv[3]);
      return console.log(JSON.stringify(decode.decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'diag2bin': {
      const bin = diagnostic.fromDiag(process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3]);
      return process__default["default"].stdout.write(bin);
    }
  case 'diag2hex': {
      const bin = diagnostic.fromDiag(process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3]);
      return console.log(byteUtils.toHex(bin));
    }
  case 'diag2json': {
      const {argv, pretty} = argvPretty();
      const bin = diagnostic.fromDiag(argv.length < 4 ? (await fromStdin()).toString() : argv[3]);
      return console.log(JSON.stringify(decode.decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'hex2bin': {
      const bin = fromHex(process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3]);
      return process__default["default"].stdout.write(bin);
    }
  case 'hex2diag': {
      const bin = fromHex(process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3]);
      for (const line of diagnostic.tokensToDiagnostic(bin)) {
        console.log(line);
      }
      return;
    }
  case 'hex2json': {
      const {argv, pretty} = argvPretty();
      const bin = fromHex(argv.length < 4 ? (await fromStdin()).toString() : argv[3]);
      return console.log(JSON.stringify(decode.decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'json2bin': {
      const inp = process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3];
      const obj = JSON.parse(inp);
      return process__default["default"].stdout.write(encode.encode(obj));
    }
  case 'json2diag': {
      const inp = process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3];
      const obj = JSON.parse(inp);
      for (const line of diagnostic.tokensToDiagnostic(encode.encode(obj))) {
        console.log(line);
      }
      return;
    }
  case 'json2hex': {
      const inp = process__default["default"].argv.length < 4 ? (await fromStdin()).toString() : process__default["default"].argv[3];
      const obj = JSON.parse(inp);
      return console.log(byteUtils.toHex(encode.encode(obj)));
    }
  default: {
      if (process__default["default"].argv.findIndex(a => a.endsWith('mocha')) === -1) {
        if (cmd) {
          console.error(`Unknown command: '${ cmd }'`);
        }
        usage(1);
      }
    }
  }
}
run().catch(err => {
  console.error(err);
  process__default["default"].exit(1);
});
var bin = true;

module.exports = bin;
