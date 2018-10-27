/**
 * github favorite markdown preview with live rendering
 * @author imcuttle <moyuyc95@gmail.com>
 */
const nps = require('path')
const { parse } = require('url')
const sseasy = require('sseasy')
const fs = require('fs')
const gss = require('github-similar-server')
const toArray = require('lodash.toarray')
const pify = require('pify')

const fsWatch = require('./reproduce-fswatch')
const detectChange = require('./md-detect-changed')

function liveMarkdownMiddleware(root, { gssOptions = {} } = {}) {
  const gssMiddleware = gss({
    markdownTemplate: nps.join(__dirname, 'template.html'),
    ...gssOptions,
    root
  })

  return toArray(sse(root, {})).concat(gssMiddleware)
}

function sse(root, {} = {}) {
  return [
    sseasy(),
    function(req, res, next) {
      if (req.query.sse !== 'on') {
        return next()
      }

      // TODO: Use web socket
      // TODO: Check heart beat
      // TODO: unwatch when disconnect
      const filename = nps.join(root, parse(req.url).pathname)
      if (fs.statSync(filename).isFile() && ['.md', '.markdown'].includes(nps.extname(filename).toLowerCase())) {
        const readFile = pify(fs.readFile)
        readFile(filename, { encoding: 'utf8' }).then(oldString => {
          fsWatch.watch(filename, { ignoreInitial: true }).on('change', function() {
            readFile(filename, { encoding: 'utf8' }).then(newString => {
              res.sse.write(JSON.stringify({ type: 'change', value: detectChange(oldString, newString) }))
              //
              oldString = newString
            })
          })
        })
        return
      }
      next()
    }
  ]
}

module.exports = liveMarkdownMiddleware
