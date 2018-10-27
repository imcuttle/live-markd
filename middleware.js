/**
 * github favorite markdown preview with live rendering
 * @author imcuttle <moyuyc95@gmail.com>
 */
const nps = require('path')
const sseasy = require('sseasy')
const gss = require('github-similar-server')
const toArray = require('lodash.toarray')

function liveMarkdownMiddleware(root, { gssOptions = {} } = {}) {
  const gssMiddleware = gss({
    markdownTemplate: nps.join(__dirname, 'template.html'),
    ...gssOptions,
    root
  })

  return toArray(gssMiddleware).concat(sse())
}

function sse({} = {}) {
  return [
    sseasy(),
    function(req, res, next) {
      // '/s'/
    }
  ]
}

module.exports = liveMarkdownMiddleware
