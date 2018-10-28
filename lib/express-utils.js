/**
 * @file express-utils
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */
const toArray = require('./to-array')

function runSeq(array) {
  array = toArray(array)
  return (req, res, next) => {
    let index = -1

    function runNext() {
      const fn = array[++index]
      if (index >= array.length) {
        return next()
      }
      if (typeof fn === 'function') {
        fn(req, res, function(err) {
          if (err instanceof Error) {
            return next.apply(this, arguments)
          }
          runNext()
        })
      }
    }

    runNext()
  }
}

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
  pos = !pos || pos < 0 ? stack.length : pos
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
  // hasBeenUnset && console.log('Unset middleware!')
}

module.exports = {
  normalizeMiddleware,
  unsetMiddleware,
  setUp,
  runSeq
}
