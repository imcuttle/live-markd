/**
 * @file example
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */

const app = require('express')()
const { setUp, unsetMiddleware } = require('../lib/express-utils')
const nps = require('path')

const hotReq = require('hot-module-require')(__dirname)

let pos
let posNull
let middle
const port = 9999

function start() {
  if (middle) {
    unsetMiddleware(app, middle, pos)
    unsetMiddleware(app, middle, posNull)
  }

  const liveMarkd = require('..')
  middle = liveMarkd(nps.join(__dirname, './docs'), {})
  pos = setUp(app, '/example', middle)
  posNull = setUp(app, null, middle)
}

start()

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
  console.log(`http://localhost:${port}/example`)
})

hotReq.accept(['..'], function() {
  console.log('Update Middleware')
  start()
})
