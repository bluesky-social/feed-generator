import chai from 'chai';
import { exec } from 'child_process';
import process from 'process';
import path from 'path';
import { platform } from 'os';
import { fileURLToPath } from 'url';
const {assert} = chai;
const fixture1JsonString = '{"a":1,"b":[2,3],"smile":"\uD83D\uDE00"}';
const fixture1JsonPrettyString = `{
  "a": 1,
  "b": [
    2,
    3
  ],
  "smile": "😀"
}
`;
const fixture1HexString = 'a3616101616282020365736d696c6564f09f9880';
const fixture1Bin = fromHex(fixture1HexString);
const fixture1BinString = new TextDecoder().decode(fixture1Bin);
const fixture1DiagnosticString = `a3                                                # map(3)
  61                                              #   string(1)
    61                                            #     "a"
  01                                              #   uint(1)
  61                                              #   string(1)
    62                                            #     "b"
  82                                              #   array(2)
    02                                            #     uint(2)
    03                                            #     uint(3)
  65                                              #   string(5)
    736d696c65                                    #     "smile"
  64                                              #   string(2)
    f09f9880                                      #     "😀"
`;
const fixture2HexString = 'a4616101616282020363627566440102036165736d696c6564f09f9880';
const fixture2DiagnosticString = `a4                                                # map(4)
  61                                              #   string(1)
    61                                            #     "a"
  01                                              #   uint(1)
  61                                              #   string(1)
    62                                            #     "b"
  82                                              #   array(2)
    02                                            #     uint(2)
    03                                            #     uint(3)
  63                                              #   string(3)
    627566                                        #     "buf"
  44                                              #   bytes(4)
    01020361                                      #     "\\x01\\x02\\x03a"
  65                                              #   string(5)
    736d696c65                                    #     "smile"
  64                                              #   string(2)
    f09f9880                                      #     "😀"
`;
const binPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../lib/bin.js');
function fromHex(hex) {
  return new Uint8Array(hex.split('').map((c, i, d) => i % 2 === 0 ? `0x${ c }${ d[i + 1] }` : '').filter(Boolean).map(e => parseInt(e, 16)));
}
async function execBin(cmd, stdin) {
  return new Promise((resolve, reject) => {
    const cp = exec(`"${ process.execPath }" "${ binPath }" ${ cmd }`, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({
        stdout,
        stderr
      });
    });
    if (stdin != null) {
      cp.on('spawn', () => {
        cp.stdin.write(stdin);
        cp.stdin.end();
      });
    }
  });
}
describe('Bin', () => {
  it('usage', async () => {
    try {
      await execBin('');
      assert.fail('should have errored');
    } catch (e) {
      assert.strictEqual(e.stdout, '');
      assert.strictEqual(e.stderr, `Usage: cborg <command> <args>
Valid commands:
\tbin2diag [binary input]
\tbin2hex [binary input]
\tbin2json [--pretty] [binary input]
\tdiag2bin [diagnostic input]
\tdiag2hex [diagnostic input]
\tdiag2json [--pretty] [diagnostic input]
\thex2bin [hex input]
\thex2diag [hex input]
\thex2json [--pretty] [hex input]
\tjson2bin '[json input]'
\tjson2diag '[json input]'
\tjson2hex '[json input]'
Input may either be supplied as an argument or piped via stdin
`);
    }
  });
  it('bad cmd', async () => {
    try {
      await execBin('blip');
      assert.fail('should have errored');
    } catch (e) {
      assert.strictEqual(e.stdout, '');
      assert.strictEqual(e.stderr, `Unknown command: 'blip'
Usage: cborg <command> <args>
Valid commands:
\tbin2diag [binary input]
\tbin2hex [binary input]
\tbin2json [--pretty] [binary input]
\tdiag2bin [diagnostic input]
\tdiag2hex [diagnostic input]
\tdiag2json [--pretty] [diagnostic input]
\thex2bin [hex input]
\thex2diag [hex input]
\thex2json [--pretty] [hex input]
\tjson2bin '[json input]'
\tjson2diag '[json input]'
\tjson2hex '[json input]'
Input may either be supplied as an argument or piped via stdin
`);
    }
  });
  it('help', async () => {
    const {stdout, stderr} = await execBin('help');
    assert.strictEqual(stdout, '');
    assert.strictEqual(stderr, `Usage: cborg <command> <args>
Valid commands:
\tbin2diag [binary input]
\tbin2hex [binary input]
\tbin2json [--pretty] [binary input]
\tdiag2bin [diagnostic input]
\tdiag2hex [diagnostic input]
\tdiag2json [--pretty] [diagnostic input]
\thex2bin [hex input]
\thex2diag [hex input]
\thex2json [--pretty] [hex input]
\tjson2bin '[json input]'
\tjson2diag '[json input]'
\tjson2hex '[json input]'
Input may either be supplied as an argument or piped via stdin
`);
  });
  it('bin2diag (stdin)', async () => {
    const {stdout, stderr} = await execBin('bin2diag', fixture1Bin);
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, fixture1DiagnosticString);
  });
  it('bin2hex (stdin)', async () => {
    const {stdout, stderr} = await execBin('bin2hex', fixture1Bin);
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, `${ fixture1HexString }\n`);
  });
  it('bin2json (stdin)', async () => {
    const {stdout, stderr} = await execBin('bin2json', fixture1Bin);
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, `${ fixture1JsonString }\n`);
  });
  it('bin2json pretty (stdin)', async () => {
    const {stdout, stderr} = await execBin('bin2json --pretty', fixture1Bin);
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, fixture1JsonPrettyString);
  });
  for (const stdin of [
      true,
      false
    ]) {
    if (platform() !== 'win32' || stdin) {
      it(`diag2bin${ stdin ? ' (stdin)' : '' }`, async () => {
        const {stdout, stderr} = !stdin ? await execBin(`diag2bin '${ fixture1DiagnosticString }'`) : await execBin('diag2bin', fixture1DiagnosticString);
        assert.strictEqual(stderr, '');
        assert.strictEqual(stdout, fixture1BinString);
      });
      it(`diag2hex${ stdin ? ' (stdin)' : '' }`, async () => {
        const {stdout, stderr} = !stdin ? await execBin(`diag2hex '${ fixture1DiagnosticString }'`) : await execBin('diag2hex', fixture1DiagnosticString);
        assert.strictEqual(stderr, '');
        assert.strictEqual(stdout, `${ fixture1HexString }\n`);
      });
      it(`diag2json${ stdin ? ' (stdin)' : '' }`, async () => {
        const {stdout, stderr} = !stdin ? await execBin(`diag2json '${ fixture1DiagnosticString }'`) : await execBin('diag2json', fixture1DiagnosticString);
        assert.strictEqual(stderr, '');
        assert.strictEqual(stdout, `${ fixture1JsonString }\n`);
      });
      it(`diag2json pretty${ stdin ? ' (stdin)' : '' }`, async () => {
        const {stdout, stderr} = !stdin ? await execBin(`diag2json --pretty '${ fixture1DiagnosticString }'`) : await execBin('diag2json --pretty', fixture1DiagnosticString);
        assert.strictEqual(stderr, '');
        assert.strictEqual(stdout, fixture1JsonPrettyString);
      });
    }
    it(`hex2bin${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin(`hex2bin ${ fixture1HexString }`) : await execBin('hex2bin', fixture1HexString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, fixture1BinString);
    });
    it(`hex2diag${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin(`hex2diag ${ fixture2HexString }`) : await execBin('hex2diag', fixture2HexString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, fixture2DiagnosticString);
    });
    it(`hex2json${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin(`hex2json ${ fixture1HexString }`) : await execBin('hex2json', fixture1HexString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, `${ fixture1JsonString }\n`);
    });
    it(`hex2json pretty${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin(`hex2json --pretty ${ fixture1HexString }`) : await execBin('hex2json --pretty', fixture1HexString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, fixture1JsonPrettyString);
    });
    it(`json2bin${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin('json2bin "{\\"a\\":1,\\"b\\":[2,3],\\"smile\\":\\"\uD83D\uDE00\\"}"') : await execBin('json2bin', fixture1JsonString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, fixture1BinString);
    });
    it(`json2diag${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin('json2diag "{\\"a\\":1,\\"b\\":[2,3],\\"smile\\":\\"\uD83D\uDE00\\"}"') : await execBin('json2diag', fixture1JsonString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, fixture1DiagnosticString);
    });
    it(`json2hex${ stdin ? ' (stdin)' : '' }`, async () => {
      const {stdout, stderr} = !stdin ? await execBin(`json2hex "${ fixture1JsonString.replace(/"/g, '\\"') }"`) : await execBin('json2hex', fixture1JsonString);
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, `${ fixture1HexString }\n`);
    });
  }
  it('diag indenting', async () => {
    const {stdout, stderr} = await execBin('json2diag', '{"a":[],"b":{},"c":{"a":1,"b":{"a":{"a":{}}}},"d":{"a":{"a":{"a":1},"b":2,"c":[]}},"e":[[[[{"a":{}}]]]],"f":1}');
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, `a6                                                # map(6)
  61                                              #   string(1)
    61                                            #     "a"
  80                                              #   array(0)
  61                                              #   string(1)
    62                                            #     "b"
  a0                                              #   map(0)
  61                                              #   string(1)
    63                                            #     "c"
  a2                                              #   map(2)
    61                                            #     string(1)
      61                                          #       "a"
    01                                            #     uint(1)
    61                                            #     string(1)
      62                                          #       "b"
    a1                                            #     map(1)
      61                                          #       string(1)
        61                                        #         "a"
      a1                                          #       map(1)
        61                                        #         string(1)
          61                                      #           "a"
        a0                                        #         map(0)
  61                                              #   string(1)
    64                                            #     "d"
  a1                                              #   map(1)
    61                                            #     string(1)
      61                                          #       "a"
    a3                                            #     map(3)
      61                                          #       string(1)
        61                                        #         "a"
      a1                                          #       map(1)
        61                                        #         string(1)
          61                                      #           "a"
        01                                        #         uint(1)
      61                                          #       string(1)
        62                                        #         "b"
      02                                          #       uint(2)
      61                                          #       string(1)
        63                                        #         "c"
      80                                          #       array(0)
  61                                              #   string(1)
    65                                            #     "e"
  81                                              #   array(1)
    81                                            #     array(1)
      81                                          #       array(1)
        81                                        #         array(1)
          a1                                      #           map(1)
            61                                    #             string(1)
              61                                  #               "a"
            a0                                    #             map(0)
  61                                              #   string(1)
    66                                            #     "f"
  01                                              #   uint(1)
`);
  });
  describe('diag length bytes', () => {
    it('compact', async () => {
      const {stdout, stderr} = await execBin('json2diag', '"aaaaaaaaaaaaaaaaaaaaaaa"');
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, `77                                                # string(23)
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
`);
    });
    it('1-byte', async () => {
      const {stdout, stderr} = await execBin('json2diag', '"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, `78 23                                             # string(35)
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  616161616161616161616161                        #   "aaaaaaaaaaaa"
`);
    });
    it('2-byte', async () => {
      const {stdout, stderr} = await execBin('json2diag', '"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');
      assert.strictEqual(stderr, '');
      assert.strictEqual(stdout, `79 0100                                           # string(256)
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  6161616161616161616161616161616161616161616161  #   "aaaaaaaaaaaaaaaaaaaaaaa"
  616161                                          #   "aaa"
`);
    });
  });
  it('diag non-utf8 and non-printable ascii', async () => {
    const input = '7864f55ff8f12508b63ef2bfeca7557ae90df6311a5ec1631b4a1fa843310bd9c3a710eaace5a1bdd72ad0bfe049771c11e756338bd93865e645f1adec9b9c99ef407fbd4fc6859e7904c5ad7dc9bd10a5cc16973d5b28ec1a6dd43d9f82f9f18c3d03418e35';
    let {stdout, stderr} = await execBin(`hex2diag ${ input }`);
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, `78 64                                             # string(86)
  f55ff8f12508b63ef2bfeca7557ae90df6311a5ec1631b  #   "õ_øñ%\\x08¶>ò¿ì§Uzé\\x0dö1\\x1a^Ác\\x1b"
  4a1fa843310bd9c3a710eaace5a1bdd72ad0bfe049771c  #   "J\\x1f¨C1\\x0bÙÃ§\\x10ê¬å¡½×*Ð¿àIw\\x1c"
  11e756338bd93865e645f1adec9b9c99ef407fbd4fc685  #   "\\x11çV3\\x8bÙ8eæEñ\\xadì\\x9b\\x9c\\x99ï@\\x7f½OÆ\\x85"
  9e7904c5ad7dc9bd10a5cc16973d5b28ec1a6dd43d9f82  #   "\\x9ey\\x04Å\\xad}É½\\x10¥Ì\\x16\\x97=[(ì\\x1amÔ=\\x9f\\x82"
  f9f18c3d03418e35                                #   "ùñ\\x8c=\\x03A\\x8e5"
`);
    ({stdout, stderr} = await execBin('diag2hex', stdout));
    assert.strictEqual(stderr, '');
    assert.strictEqual(stdout, `${ input }\n`);
  });
});