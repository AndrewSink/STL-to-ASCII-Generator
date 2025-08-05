const path = require('path');

module.exports = {
  entry: './src/script.js', // your main JS file
  output: {
    filename: 'bundle.js', // output file name
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development', // use 'production' for minified output
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: 'source-map', // easier debugging
};
