const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

module.exports = {
    mode: "development",
    entry: {
        "hibiki/code-highlight": ["./src/hibiki/code-highlight/index.ts"],
    },
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "[name]/bundle-dev.js"
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
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {from: "**/*.html", to: ".", context: "src/", noErrorOnMissing: true},
                {from: "**/*.css", to: ".", context: "src/", noErrorOnMissing: true},
            ],
        }),
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.wasm', '.json', '.less', '.css']
    },
}
