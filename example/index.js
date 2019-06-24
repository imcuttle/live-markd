/**
 * @file example
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */

const app = require('express')()
const { runSeq } = require('../lib/express-utils')
const nps = require('path')

const middleGetter = require('hot-module-require')(__dirname)('..')

const port = 9999

app.use(function() {
  const middles = middleGetter()(nps.join(__dirname, './docs'))
  return runSeq(middles).apply(this, arguments)
})
app.use('/example', function() {
  const middles = middleGetter()(nps.join(__dirname, './docs'))
  return runSeq(middles).apply(this, arguments)
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
  console.log(`http://localhost:${port}/example`)
})
