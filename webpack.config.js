const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const path = require('path');
const autoprefixer = require('autoprefixer');
const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

const environment = {
  local: '"LOCAL"',
  dev: '"DEV"',
  prod: '"PROD"'
};
let buildVariable = environment.dev;
const isProduction = process.argv.indexOf('-p') > -1;
const isLocal = process.argv.indexOf('-d') > -1;

if (isLocal) {
  buildVariable = environment.local;
}
else if (isProduction) {
  buildVariable = environment.prod;
}

const webpackConfig = {
  entry: {
    polyfills: './src/_entrypoints/polyfills.ts',
    vendor: './src/_entrypoints/vendor.ts',
    main: './src/_entrypoints/main.ts'
  },
  output: {
    publicPath: '',
    path: path.resolve(__dirname, './dist'),
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['main', 'vendor', 'polyfills']
    }),
    new ServiceWorkerWebpackPlugin({
      entry: path.join(__dirname, './src/_serviceworkers/sw.ts')
    }),
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
      'THREE': 'three'
    })
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
          {loader: 'raw-loader'},
          {loader: 'postcss-loader'},
          {loader: 'sass-loader'}
        ]
      },
      {
        test: /\.(html|vert|frag)$/,
        loaders: ['raw-loader']
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
    extensions: [ '.ts', '.js' ],
    modules: [ path.resolve(__dirname, 'node_modules') ],
    alias: {
        ui: path.resolve(__dirname, 'src/ui/'),
        core: path.resolve(__dirname, 'src/core/'),
        data: path.resolve(__dirname, 'src/data/'),
        assets: path.resolve(__dirname, 'src/assets/'),
        'three/VRControls': path.join(__dirname, 'node_modules/three/examples/js/controls/VRControls.js'),
        'three/VREffect': path.join(__dirname, 'node_modules/three/examples/js/effects/VREffect.js'),
        'three/SvrControls': path.join(__dirname, 'src/ui/editor/util/SvrControls.js')
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
    ,host: '0.0.0.0', disableHostCheck: true
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
