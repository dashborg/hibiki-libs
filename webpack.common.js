const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    mode: "development",
    output: {
        filename: "bundle-dev.js"
    },
    externals: {
        "react": "Hibiki.ImportLibs.React",
        "react-dom": "Hibiki.ImportLibs.ReactDOM",
        "mobx": "Hibiki.ImportLibs.mobx",
        "mobx-react": "Hibiki.ImportLibs.mobxReact",
        "hibiki-datactx": "Hibiki.ImportLibs.HibikiDataCtx",
        "hibiki-dbctx": "Hibiki.ImportLibs.HibikiDBCtx",
        "hibiki": "Hibiki",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
                        plugins: [
                            ["@babel/transform-runtime", {"regenerator": true}],
                            "@babel/plugin-transform-react-jsx",
                            ["@babel/plugin-proposal-decorators", { "legacy": true }],
                            ["@babel/plugin-proposal-class-properties", { "loose": true }],
                            ["@babel/plugin-proposal-private-methods", { "loose": true }],
                            ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
                            "babel-plugin-jsx-control-statements",
                        ],
                    },
                },
            },
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                        plugins: [
                            ["@babel/transform-runtime", {"regenerator": true}],
                            "@babel/plugin-transform-react-jsx",
                            ["@babel/plugin-proposal-decorators", { "legacy": true }],
                            ["@babel/plugin-proposal-class-properties", { "loose": true }],
                            ["@babel/plugin-proposal-private-methods", { "loose": true }],
                            ["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
                            "babel-plugin-jsx-control-statements",
                        ],
                    },
                },
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader",
                ],
            },
            {
                test: /\.less$/,
                use: [
                    {loader: MiniCssExtractPlugin.loader},
                    "css-loader",
                    "less-loader"
                ]
            },
        ]
    },
    plugins: [],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.wasm', '.json', '.less', '.css']
    },
}
