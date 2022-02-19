const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require("path");

module.exports = merge.merge(common, {
    mode: "production",
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "[name]/bundle-prod.js",
    },
    devtool: "source-map",
    optimization: {
        minimize: true,
    },
});
