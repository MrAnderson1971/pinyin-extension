const path = require('path');

module.exports = {
    entry: {
        content: './content.js', // Entry point for the content script
        background: './background.js' // Entry point for the background script
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].bundle.js', // Output bundle files based on entry point names
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
    devtool: 'source-map'
};
