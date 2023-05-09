exports.Encoder = require('./encode').Encoder
exports.Decoder = require('./decode').Decoder
exports.addExtension = require('./encode').addExtension
let encoder = new exports.Encoder({ useRecords: false })
exports.decode = encoder.decode
exports.encode = encoder.encode
Object.assign(exports, {
	ALWAYS:1,
	DECIMAL_ROUND: 3,
	DECIMAL_FIT: 4
})
