const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        content: './content.js',
        background: './background.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ["@babel/preset-env", {
                                "targets": "defaults"
                            }]
                        ]
                    },
                },
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'manifest.json', to: 'manifest.json' },
                { from: 'icon16.png', to: 'icon16.png' },
                { from: 'icon48.png', to: 'icon48.png' },
                { from: 'icon128.png', to: 'icon128.png' }
            ],
        }),
    ],
    devtool: 'source-map'
};
