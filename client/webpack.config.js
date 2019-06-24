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

const { namespace, distPath } = require('../config')
const { runSeq } = require('../lib/express-utils')

const hotRequire = makeHotRequire(__dirname)

const emitter = new EventEmitter()

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins(/*loader*/) {
      return [
        require('autoprefixer')({ remove: false }),
        require('cssnano')({
          zindex: false,
          // https://github.com/ben-eb/cssnano/issues/361
          reduceIdents: false
        })
      ]
    }
  }
}

function getWebpackConfig({
  htmlTemplatePath = nps.join(__dirname, '../template.html'),
  entry = nps.join(__dirname, './src/index.js'),
  debug,
  dist = distPath,
  sourceMap,
  prod = true,
  compilationSuccessInfo,
  context,
  port = 10000
} = {}) {
  const mode = prod ? 'production' : 'development'
  console.log('mode', mode)

  return {
    devServer: {
      noInfo: true,
      port,
      after: function(app) {
        let curHtml
        const middlesGetter = hotRequire('..')
        app.use('/', function() {
          const middles = middlesGetter()(nps.join(__dirname, '../example/docs'), {
            gssOptions: {
              markdownTemplateString: curHtml
            }
          })

          return runSeq(middles).apply(this, arguments)
        })

        emitter.on('html-plugin-after', html => {
          curHtml = html.source()
        })
      }
    },
    entry,
    context,
    mode,
    devtool: !prod || sourceMap ? 'source-map' : false,
    output: {
      path: dist,
      chunkFilename: `${namespace}/[name].js`,
      filename: `${namespace}/[name].js`
    },
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
        filename: `${namespace}/style.css`,
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
            if (HtmlWebpackPlugin && HtmlWebpackPlugin.getHooks) {
              // v4
              HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync('MyPlugin', afterEmit)
              prod && HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tap('MyPlugin', alterAssetTags)
            } else {
              // v3
              compilation.hooks.htmlWebpackPluginAfterEmit.tapAsync('MyPlugin', afterEmit)
              prod && compilation.hooks.htmlWebpackPluginAlterAssetTags.tap('MyPlugin', alterAssetTags)
            }

            function afterEmit(data, cb) {
              emitter.emit('html-plugin-after', data.html)
              cb(null, data)
            }
            function alterAssetTags(pluginArgs) {
              // V3
              function overwrite(tag) {
                if (tag.attributes.href) {
                  tag.attributes.href = '<%=baseUrl%>' + tag.attributes.href.replace(/^\/+/, '')
                }
                if (tag.attributes.src) {
                  tag.attributes.src = '<%=baseUrl%>' + tag.attributes.src.replace(/^\/+/, '')
                }
              }
              pluginArgs.head && pluginArgs.head.forEach(overwrite)
              pluginArgs.body && pluginArgs.body.forEach(overwrite)
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
            },
            postcssLoader
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
