"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeWriter = void 0;
const createBlockingWriter = (stream) => {
    return (message) => {
        stream.write(message + '\n');
    };
};
const createNodeWriter = () => {
    var _a;
    // eslint-disable-next-line node/no-process-env
    const targetStream = ((_a = process.env.ROARR_STREAM) !== null && _a !== void 0 ? _a : 'STDOUT').toUpperCase();
    const stream = targetStream.toUpperCase() === 'STDOUT' ? process.stdout : process.stderr;
    stream.on('error', (error) => {
        if (error.code === 'EPIPE') {
            return;
        }
        throw error;
    });
    return createBlockingWriter(stream);
};
exports.createNodeWriter = createNodeWriter;
//# sourceMappingURL=createNodeWriter.js.map