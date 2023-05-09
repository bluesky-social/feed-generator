import process from 'process';
import {
  decode,
  encode
} from '../cborg.js';
import {
  tokensToDiagnostic,
  fromDiag
} from './diagnostic.js';
import {
  fromHex as _fromHex,
  toHex
} from './byte-utils.js';
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
  process.exit(code || 0);
}
async function fromStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function fromHex(str) {
  str = str.replace(/\r?\n/g, '');
  if (!/^([0-9a-f]{2})*$/i.test(str)) {
    throw new Error('Input string is not hexadecimal format');
  }
  return _fromHex(str);
}
function argvPretty() {
  const argv = process.argv.filter(s => s !== '--pretty');
  const pretty = argv.length !== process.argv.length;
  return {
    argv,
    pretty
  };
}
async function run() {
  const cmd = process.argv[2];
  switch (cmd) {
  case 'help': {
      return usage(0);
    }
  case 'bin2diag': {
      const bin = process.argv.length < 4 ? await fromStdin() : new TextEncoder().encode(process.argv[3]);
      for (const line of tokensToDiagnostic(bin)) {
        console.log(line);
      }
      return;
    }
  case 'bin2hex': {
      const bin = process.argv.length < 4 ? await fromStdin() : new TextEncoder().encode(process.argv[3]);
      return console.log(toHex(bin));
    }
  case 'bin2json': {
      const {argv, pretty} = argvPretty();
      const bin = argv.length < 4 ? await fromStdin() : new TextEncoder().encode(argv[3]);
      return console.log(JSON.stringify(decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'diag2bin': {
      const bin = fromDiag(process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3]);
      return process.stdout.write(bin);
    }
  case 'diag2hex': {
      const bin = fromDiag(process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3]);
      return console.log(toHex(bin));
    }
  case 'diag2json': {
      const {argv, pretty} = argvPretty();
      const bin = fromDiag(argv.length < 4 ? (await fromStdin()).toString() : argv[3]);
      return console.log(JSON.stringify(decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'hex2bin': {
      const bin = fromHex(process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3]);
      return process.stdout.write(bin);
    }
  case 'hex2diag': {
      const bin = fromHex(process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3]);
      for (const line of tokensToDiagnostic(bin)) {
        console.log(line);
      }
      return;
    }
  case 'hex2json': {
      const {argv, pretty} = argvPretty();
      const bin = fromHex(argv.length < 4 ? (await fromStdin()).toString() : argv[3]);
      return console.log(JSON.stringify(decode(bin), undefined, pretty ? 2 : undefined));
    }
  case 'json2bin': {
      const inp = process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3];
      const obj = JSON.parse(inp);
      return process.stdout.write(encode(obj));
    }
  case 'json2diag': {
      const inp = process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3];
      const obj = JSON.parse(inp);
      for (const line of tokensToDiagnostic(encode(obj))) {
        console.log(line);
      }
      return;
    }
  case 'json2hex': {
      const inp = process.argv.length < 4 ? (await fromStdin()).toString() : process.argv[3];
      const obj = JSON.parse(inp);
      return console.log(toHex(encode(obj)));
    }
  default: {
      if (process.argv.findIndex(a => a.endsWith('mocha')) === -1) {
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
  process.exit(1);
});
export default true;