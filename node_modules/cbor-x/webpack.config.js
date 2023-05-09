var webpack = require('webpack')
var path = require('path')
module.exports = {
    entry: {
        index: './browser.js'
    },
    output: {
        path: path.join(__dirname, 'dist'),
        library: 'CBOR',
        libraryTarget: 'umd'
    },
    node: { Buffer: false },
    devtool: 'source-map',
    optimization: {
        minimize: true
    },
    //mode: 'development'
    mode: 'production'
};
