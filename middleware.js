/**
 * github favorite markdown preview with live rendering
 * @author imcuttle <moyuyc95@gmail.com>
 */
const nps = require('path')
const gss = require('github-similar-server')

function liveMarkdownMiddleware(root, { gssOptions = {} } = {}) {
  const gssMiddleware = gss({
    markdownTemplate: nps.join(__dirname, 'template.html'),
    ...gssOptions,
    root
  })

  return gssMiddleware
}

module.exports = liveMarkdownMiddleware
