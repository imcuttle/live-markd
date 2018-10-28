/**
 * @file index
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */
const express = require('express')
const middleware = require('./lib/middleware')

function liveMarkd(root, { port, baseUrl = '', ...opts } = {}) {
  const middle = middleware(root, opts)
  if (port) {
    const app = express()
    // Set up server
    baseUrl ? app.use(baseUrl, middle) : app.use(middle)
    app.listen(port, () => {
      console.log(`LiveMarkd running on http://localhost:${port}${baseUrl}`)
    })
    return app
  }

  // Return express middleware
  return middle
}

module.exports = liveMarkd
