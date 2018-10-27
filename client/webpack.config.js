/**
 * @file webpack.config
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/26
 *
 */

const nps = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrors = require('friendly-errors-webpack-plugin')

const EventEmitter = require('events')
const fs = require('fs')
const makeHotRequire = require('hot-module-require')
const toArray = require('lodash.toarray')
const hotRequire = makeHotRequire(__dirname)

const emitter = new EventEmitter()

function normalizeMiddleware(app, path, middleware) {
  middleware = toArray(middleware)
  path ? app.use(path, middleware) : app.use(middleware)
  const stack = app._router.stack
  const handles = stack.slice(stack.length - middleware.length)
  stack.splice(stack.length - middleware.length, middleware.length)

  return handles
}

function setUp(app, path, middleware, pos) {
  const handles = normalizeMiddleware(app, path, middleware)

  const stack = app._router.stack
  pos = !pos || pos < 0 ? stack.length - 1 : pos
  stack.splice.apply(stack, [pos, 0].concat(handles))

  return pos
}

function unsetMiddleware(app, middleware) {
  let hasBeenUnset = false
  const stack = app._router.stack

  normalizeMiddleware(app, null, middleware).forEach(m => {
    const index = stack.findIndex(x => x.handle === m)
    hasBeenUnset = true

    if (index >= 0) {
      app._router.stack.splice(index, 1)
    }
  })
  hasBeenUnset && console.log('Unset middleware!')
}

function getWebpackConfig({
  htmlTemplatePath = nps.join(__dirname, '../template.html'),
  entry = nps.join(__dirname, './src/index.js'),
  debug,
  dist = nps.join(__dirname, '../dist'),
  sourceMap,
  prod = true,
  compilationSuccessInfo,
  context,
  port = 10000
} = {}) {
  const mode = prod ? 'production' : 'development'
  return {
    devServer: {
      port,
      after: function(app) {
        let pos
        let middles
        let curHtml
        function register() {
          middles = require('../middleware')(nps.join(__dirname, '../__tests__/fixture'), {
            gssOptions: {
              markdownTemplateString: curHtml
            }
          })
          pos = setUp(app, '/docs', middles, pos)
        }

        function handleUpdate(oldModule, path) {
          console.log('Detect updating middleware!')
          unsetMiddleware(app, middles)
          register()
        }

        emitter.on('html-plugin-after', html => {
          curHtml = html.source()
          register()

          hotRequire.refuse(['../middleware'], handleUpdate)
          hotRequire.accept(['../middleware'], handleUpdate)
        })
      }
    },
    entry,
    context,
    mode,
    devtool: !prod || sourceMap ? 'source-map' : false,
    output: { path: dist, chunkFilename: 'assets/[name].js', filename: 'assets/[name].js', publicPath: '/' },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: { styles: { name: 'styles', test: /\.css$/, chunks: 'all', enforce: true } }
      }
    },
    plugins: [
      !debug &&
        new FriendlyErrors({
          compilationSuccessInfo
        }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(mode)
        }
      }),
      new MiniCssExtractPlugin({
        // disable: !prod,
        filename: 'assets/style.css',
        allChunks: true
      }),
      new HtmlWebpackPlugin({
        filename: 'template.html',
        template: htmlTemplatePath,
        templateParameters: {
          title: '<%=title%>',
          markdownHTML: '<%=markdownHTML%>'
        }
      }),
      {
        apply(compiler) {
          compiler.hooks.compilation.tap('MyPlugin', compilation => {
            // v4
            if (HtmlWebpackPlugin && HtmlWebpackPlugin.getHooks) {
              HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync(
                'MyPlugin', // <-- Set a meaningful name here for stacktraces
                afterEmit
              )
            } else {
              // v3
              compilation.hooks.htmlWebpackPluginAfterEmit.tapAsync('MyPlugin', afterEmit)
            }

            function afterEmit(data, cb) {
              emitter.emit('html-plugin-after', data.html)
              cb(null, data)
            }
          })
        }
      }
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: [/node_modules/],
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                presets: [[require.resolve('babel-preset-env'), { targets: { browsers: ['ie 11'] } }]],
                plugins: [
                  require.resolve('babel-plugin-transform-object-rest-spread'),
                  require.resolve('babel-plugin-transform-runtime')
                ]
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: prod ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
              options: { sourceMap: true }
            },
            {
              loader: require.resolve('css-loader'),
              options: {
                // url: false,
                minimize: true,
                sourceMap: true
              }
            }
          ]
        }
      ]
    }
  }
}

if (process.env.NODE_ENV === 'production') {
  module.exports = getWebpackConfig({ prod: true })
} else {
  module.exports = getWebpackConfig({ prod: false })
}
