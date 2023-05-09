import assert from 'assert'
import { promisify } from 'util'
import { execFile } from 'child_process'
import { promises as fsPromises } from 'fs'

const { unlink, stat } = fsPromises

const goCarCids = [
  'bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq',
  'bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4',
  'bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke',
  'bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm',
  'bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm',
  'QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT',
  'QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d',
  'QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys']

async function cleanGoCarDump () {
  return Promise.all(goCarCids.map((c) => unlink(c)))
}

async function runExample (name, args = []) {
  return promisify(execFile)(process.execPath, [`${name}.js`].concat(args))
}

runExample('round-trip').then(({ stdout, stderr }) => {
  assert.strictEqual(stderr, '')
  assert.strictEqual(stdout, 'Retrieved [random meaningless bytes] from example.car with CID [bafkreihwkf6mtnjobdqrkiksr7qhp6tiiqywux64aylunbvmfhzeql2coa]\n')
  console.log('\u001b[32m✔\u001b[39m [example] round-trip')
}).then(async () => {
  await runExample('verify-car', ['example.car']).then(({ stdout, stderr }) => {
    assert.strictEqual(stderr, '')
    assert.strictEqual(stdout, 'Verified 1 block(s) in example.car\n')
    console.log('\u001b[32m✔\u001b[39m [example] verify-car example.car')
  })
}).then(async () => {
  await runExample('verify-car', ['../test/go.car']).then(({ stdout, stderr }) => {
    assert.strictEqual(stderr, '')
    assert.strictEqual(stdout, 'Verified 8 block(s) in ../test/go.car\n')
    console.log('\u001b[32m✔\u001b[39m [example] verify-car ../test/go.car')
  })
}).then(async () => {
  try {
    await cleanGoCarDump()
  } catch (err) {} // failure is expected, this is just a prep
  await runExample('dump-car', ['../test/go.car']).then(async ({ stdout, stderr }) => {
    assert.strictEqual(stderr, '')
    assert.strictEqual(stdout,
`Version: 1
Roots: [bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm, bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm]
Blocks:
#1 bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm [dag-cbor]
'{"link":{"/":"QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d"},"name":"blip"}'
#2 QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d [dag-pb]
'{"Links":[{"Hash":{"/":"bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke"},"Name":"bear","Tsize":4},{"Hash":{"/":"QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys"},"Name":"second","Tsize":149}]}'
#3 bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke [raw]
'{"/":{"bytes":"Y2NjYw"}}'
#4 QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys [dag-pb]
'{"Links":[{"Hash":{"/":"bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4"},"Name":"dog","Tsize":4},{"Hash":{"/":"QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT"},"Name":"first","Tsize":51}]}'
#5 bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4 [raw]
'{"/":{"bytes":"YmJiYg"}}'
#6 QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT [dag-pb]
'{"Links":[{"Hash":{"/":"bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq"},"Name":"cat","Tsize":4}]}'
#7 bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq [raw]
'{"/":{"bytes":"YWFhYQ"}}'
#8 bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm [dag-cbor]
'{"link":null,"name":"limbo"}'
`)
    assert.strictEqual((await Promise.all(goCarCids.map((c) => stat(c)))).map((s) => s.isFile()).filter(Boolean).length, goCarCids.length)
    await cleanGoCarDump()
    console.log('\u001b[32m✔\u001b[39m [example] dump-car ../test/go.car')
  })
}).then(async () => {
  await runExample('car-to-fixture', ['../test/go.car']).then(({ stdout, stderr }) => {
    assert.strictEqual(stderr, '')
    assert.strictEqual(stdout, '{"blocks":[{"blockLength":55,"blockOffset":137,"cid":{"/":"bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm"},"content":{"link":{"/":"QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d"},"name":"blip"},"length":92,"offset":100},{"blockLength":97,"blockOffset":228,"cid":{"/":"QmNX6Tffavsya4xgBi2VJQnSuqy9GsxongxZZ9uZBqp16d"},"content":{"Links":[{"Hash":{"/":"bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke"},"Name":"bear","Tsize":4},{"Hash":{"/":"QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys"},"Name":"second","Tsize":149}]},"length":133,"offset":192},{"blockLength":4,"blockOffset":362,"cid":{"/":"bafkreifw7plhl6mofk6sfvhnfh64qmkq73oeqwl6sloru6rehaoujituke"},"content":{"/":{"bytes":"Y2NjYw"}},"length":41,"offset":325},{"blockLength":94,"blockOffset":402,"cid":{"/":"QmWXZxVQ9yZfhQxLD35eDR8LiMRsYtHxYqTFCBbJoiJVys"},"content":{"Links":[{"Hash":{"/":"bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4"},"Name":"dog","Tsize":4},{"Hash":{"/":"QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT"},"Name":"first","Tsize":51}]},"length":130,"offset":366},{"blockLength":4,"blockOffset":533,"cid":{"/":"bafkreiebzrnroamgos2adnbpgw5apo3z4iishhbdx77gldnbk57d4zdio4"},"content":{"/":{"bytes":"YmJiYg"}},"length":41,"offset":496},{"blockLength":47,"blockOffset":572,"cid":{"/":"QmdwjhxpxzcMsR3qUuj7vUL8pbA7MgR3GAxWi2GLHjsKCT"},"content":{"Links":[{"Hash":{"/":"bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq"},"Name":"cat","Tsize":4}]},"length":82,"offset":537},{"blockLength":4,"blockOffset":656,"cid":{"/":"bafkreidbxzk2ryxwwtqxem4l3xyyjvw35yu4tcct4cqeqxwo47zhxgxqwq"},"content":{"/":{"bytes":"YWFhYQ"}},"length":41,"offset":619},{"blockLength":18,"blockOffset":697,"cid":{"/":"bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm"},"content":{"link":null,"name":"limbo"},"length":55,"offset":660}],"header":{"roots":[{"/":"bafyreihyrpefhacm6kkp4ql6j6udakdit7g3dmkzfriqfykhjw6cad5lrm"},{"/":"bafyreidj5idub6mapiupjwjsyyxhyhedxycv4vihfsicm2vt46o7morwlm"}],"version":1}}\n')
    console.log('\u001b[32m✔\u001b[39m [example] car-to-fixture ../test/go.car')
  })
}).catch((err) => {
  console.error(err.stack)
  process.exit(1)
})
