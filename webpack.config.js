const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const path = require('path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');


const environment = {
  local: '"LOCAL"',
  dev: '"DEV"',
  prod: '"PROD"'
};
const isProduction = process.argv.indexOf('-p') > -1;
const isLocal = process.argv.indexOf('-d') > -1;
const buildVariable = isLocal ? environment.local : isProduction ? environment.prod: environment.dev;


const webpackConfig = {
  entry: {
    polyfills: './src/_entrypoints/polyfills.ts',
    vendor: './src/_entrypoints/vendor.ts',
    main: './src/_entrypoints/main.ts'
  },

  output: {
    publicPath: '',
    path: path.resolve(__dirname, './dist'),
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js'
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['main', 'vendor', 'polyfills']
    }),

    // TODO: check and enable
    // new ServiceWorkerWebpackPlugin({
    //   entry: path.join(__dirname, './src/_serviceworkers/sw.ts')
    // }),

    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      path.resolve(__dirname, './src'),
      {
        // Angular Async Route paths relative to this root directory
      }
    ),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [
          autoprefixer(),
        ]
      }
    }),

    new webpack.ProvidePlugin({
      Reflect: 'core-js/es7/reflect'
    }),

    new WebpackMd5Hash(),
    new ManifestPlugin(),

    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, './dist/index.html'),
      inject: true,
      template: './src/index.html'
    }),
  ],
  externals: {
    build: buildVariable
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader?useBabel=true',
          'angular2-template-loader'
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          { loader: 'raw-loader' },
          { loader: 'postcss-loader' },
          { loader: 'sass-loader' }
        ]
      },
      {
        test: /\.(html|vert|frag)$/,
        loaders: ['raw-loader'],
        exclude: /index\.html$/
      },
      // {
      //   test: /\.(png|jpg)$/,
      //   use: [{
      //     loader: 'url-loader',
      //     options: {
      //       limit: 12000  // Convert images < 12k to base64 strings
      //     }
      //   }]
      // }
    ]
  }
};

const defaultConfig = {
  devtool: 'source-map',

  output: {
    filename: '[name].bundle.js',
    sourceMapFilename: '[name].map',
    chunkFilename: '[id].chunk.js'
  },

  resolve: {
    extensions: ['.ts', '.js'],
    modules: [path.resolve(__dirname, 'node_modules')],
    alias: {
      'aframe-look-at-component': path.resolve(__dirname, 'node_modules/kframe/components/look-at/index.js'),
      ui: path.resolve(__dirname, 'src/ui/'),
      core: path.resolve(__dirname, 'src/core/'),
      data: path.resolve(__dirname, 'src/data/'),
      assets: path.resolve(__dirname, 'src/assets/'),
    }
  },

  devServer: {
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300, poll: 1000 },
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
    port: 3000
    // To access dev server from other devices on the network uncomment the following line
    , host: '0.0.0.0', disableHostCheck: true
  },

  node: {
    global: true,
    crypto: 'empty',
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: false,
    clearImmediate: false,
    setImmediate: false
  },
};

module.exports = webpackMerge(defaultConfig, webpackConfig);
