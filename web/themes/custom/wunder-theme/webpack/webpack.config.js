const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Default to development mode
const mode = process.argv.includes('--mode=production')
  ? 'production'
  : 'development';

module.exports = {
  // Specify the mode to use: 'development' or 'production'
  mode,

  // Entry point of the application
  entry: {
    style: './components/style.scss', // Name the entry point 'style'
  },

  // Output configuration
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
  },

  // Module rules to handle different file types
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i, // Match .scss and .sass files
        use: [
          MiniCssExtractPlugin.loader, // Extract CSS into files
          'css-loader', // Resolves CSS imports and url()s
          {
            loader: 'sass-loader', // Compiles Sass to CSS
            options: {
              implementation: require('sass'),
              sassOptions: {
                outputStyle: mode === 'production' ? 'compressed' : 'expanded',
              },
            },
          },
        ],
        include: path.resolve(__dirname, '../components'),
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css', // Output CSS files with the same name as the entry point
    }),
  ],
  optimization: {
    minimize: mode === 'production',
  },
  // Output source maps for easier debugging in development mode
  devtool: mode === 'production' ? 'source-map' : 'eval-source-map',
};
