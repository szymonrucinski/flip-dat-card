const path = require('path');

module.exports = {
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        // use: 'ts-loader',
          use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  resolve: {
    extensions: [ '.tsx', '.ts', '.js','.json' ],
  },
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'public'),
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 8080
  }
  

};

