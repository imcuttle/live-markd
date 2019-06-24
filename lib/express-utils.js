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

module.exports = {
  runSeq
}
