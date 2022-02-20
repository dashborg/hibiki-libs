const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge.merge(common, {
    mode: "development",
    devtool: "inline-source-map",
    watchOptions: {
        aggregateTimeout: 200,
    },
});

