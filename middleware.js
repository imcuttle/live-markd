/**
 * github favorite markdown preview with live rendering
 * @author imcuttle <moyuyc95@gmail.com>
 */
const nps = require('path')
const { parse } = require('url')
const fs = require('fs')
const gss = require('github-similar-server')
const toArray = require('lodash.toarray')
const pify = require('pify')

const fsWatch = require('./reproduce-fswatch')
const detectChange = require('./md-detect-changed')
const createEventStream = require('./createEventStream')
const readFile = pify(fs.readFile)

function liveMarkdownMiddleware(root, { gssOptions = {} } = {}) {
  const gssMiddleware = gss({
    markdownTemplate: nps.join(__dirname, 'template.html'),
    ...gssOptions,
    root
  })

  return toArray(sse(root, {})).concat(gssMiddleware)
}

function createFactory() {
  const wmap = new Map()
  const fileContents = new Map()
  let watcher
  let changBounded = false

  function watch(path) {
    if (!watcher) {
      watcher = fsWatch.watch(path, { cwd: null, ignoreInitial: true })
      return watcher
    }
    return watcher.add(path)
  }

  return {
    get(filename) {
      if (!wmap.get(filename)) {
        const es = createEventStream(10 * 1000)
        wmap.set(filename, es)
      }
      return wmap.get(filename)
    },
    watch(filename) {
      if (watcher) {
        const obj = watcher.getWatched()
        const isIncludes = Object.keys(obj).some(dir => {
          return obj[dir].some(name => nps.join(dir, name) === filename)
        })
        if (isIncludes) return
      }

      const wat = watch(filename)
      readFile(filename, { encoding: 'utf8' }).then(oldString => {
        fileContents.set(filename, oldString)

        // Bind change event once
        if (changBounded) {
          return
        }
        changBounded = true
        wat.on('change', function(filename) {
          const es = wmap.get(filename)
          const nativeOldString = fileContents.get(filename)
          if (!es) return
          readFile(filename, { encoding: 'utf8' }).then(newString => {
            es.publish({ type: 'change', value: detectChange(nativeOldString, newString) })
            fileContents.set(filename, newString)
          })
        })
      })
    },
    remove(filename) {
      const es = wmap.get(filename)
      if (es) {
        es.close()
      }
      if (watcher) {
        watcher.unwatch(filename)
      }
      wmap.delete(filename)
      fileContents.delete(filename)
    },
    close() {
      watcher && watcher.close()
      for (let es of wmap.values()) {
        es.close()
      }
      watcher = null
      changBounded = false
      wmap.clear()
      fileContents.clear()
    }
  }
}

const factory = createFactory()

function sse(root, {} = {}) {
  return function(req, res, next) {
    if (req.query.sse !== 'on') {
      return next()
    }

    // TODO: Use web socket
    // TODO: Check heart beat
    // TODO: unwatch when disconnect
    // console.log(req.originalUrl)
    const filename = nps.join(root, parse(req.url).pathname)
    if (fs.statSync(filename).isFile() && ['.md', '.markdown'].includes(nps.extname(filename).toLowerCase())) {
      const sse = factory.get(filename)
      sse.handler(req, res)

      factory.watch(filename)
      return
    }
    next()
  }
}

module.exports = liveMarkdownMiddleware
