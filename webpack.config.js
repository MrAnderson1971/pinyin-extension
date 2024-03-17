const path = require('path');

module.exports = {
    entry: './content.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'content.bundle.js', // Output bundle file
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
};
