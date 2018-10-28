/**
 * github favorite markdown preview with live rendering
 * @author imcuttle <moyuyc95@gmail.com>
 */
const nps = require('path')
const { parse } = require('url')
const fs = require('fs')
const gss = require('github-similar-server')
const toArray = require('./to-array')
const pify = require('pify')

const { distPath, namespace } = require('../config')

const fsWatch = require('./reproduce-fswatch/index')
const detectChange = require('./md-detect-changed')
const createEventStream = require('./createEventStream')
const { runSeq } = require('./express-utils')
const readFile = pify(fs.readFile)

function liveMarkdownMiddleware(root, opts = {}) {
  let middles = []
  const { factory, handle } = sseHandler(root, opts)
  middles = middles.concat(toArray(handle))
  middles = middles.concat(toArray(handleClientAssets))
  middles = middles.concat(toArray(wrapGss(root, opts.gssOptions)))
  return Object.assign(middles, process.env.NODE_ENV === 'test' ? { factory } : {}, factory)
}

function handleClientAssets(req, res, next) {
  const url = decodeURIComponent(parse(req.url).pathname).replace(/^\/+/, '')
  if (url.startsWith(namespace + '/')) {
    const filename = nps.join(distPath, url)
    if (fs.statSync(filename).isFile()) {
      res.sendFile(filename)
    }
  } else {
    next()
  }
}

function wrapGss(root, gssOptions = {}) {
  return function(req, res, next) {
    const baseUrl = req.baseUrl || '/'

    const gssMiddleware = gss({
      markdownTemplate: nps.join(distPath, 'template.html'),
      ...gssOptions,
      templateParameters: {
        ...gssOptions.templateParameters,
        baseUrl: baseUrl.replace(/\/*$/, '/')
      },
      root
    })

    runSeq(gssMiddleware)(req, res, next)
  }
}

function createFactory({ heartBeatDelay = 10 * 1000 } = {}) {
  const wmap = new Map()
  const fileContents = new Map()
  function changeHandle(filename) {
    const es = wmap.get(filename)
    if (!es) return

    const nativeOldString = fileContents.get(filename)
    readFile(filename, { encoding: 'utf8' }).then(newString => {
      es.publish({ type: 'change', value: detectChange(nativeOldString, newString) })
      fileContents.set(filename, newString)
    })
  }
  let watcher
  let changBounded = false

  function watch(path) {
    if (!watcher) {
      watcher = fsWatch.watch(path, { cwd: null, ignoreInitial: true })
      return watcher.on('change', changeHandle)
    }
    return watcher.add(path)
  }

  return {
    get(filename) {
      if (!wmap.get(filename)) {
        const es = createEventStream(heartBeatDelay)
        wmap.set(filename, es)
      }
      return wmap.get(filename)
    },
    getEventSourceMap: () => wmap,
    getFileContentsMap: () => fileContents,
    getWatcher: () => watcher,
    watch(filename) {
      if (watcher) {
        const obj = watcher.getWatched()
        const isIncludes = Object.keys(obj).some(dir => {
          return obj[dir].some(name => nps.join(dir, name) === filename)
        })
        if (isIncludes) return
      }

      watch(filename)
      readFile(filename, { encoding: 'utf8' }).then(oldString => {
        fileContents.set(filename, oldString)
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

function sseHandler(root, { heartBeatDelay } = {}) {
  const factory = createFactory({ heartBeatDelay })

  const isHit = filename =>
    fs.statSync(filename).isFile() && ['.md', '.markdown'].includes(nps.extname(filename).toLowerCase())

  return {
    handle: function(req, res, next) {
      if (req.query.sse !== 'on') {
        return next()
      }

      let filename = nps.join(root, decodeURIComponent(parse(req.url).pathname))

      const nameList = [
        'Readme.md',
        'readme.md',
        'README.md',
        'README.MD',
        'readme.markdown',
        'README.markdown',
        'README.MARKDOWN',
        'index.md'
      ]

      if (fs.statSync(filename).isDirectory()) {
        const names = fs.readdirSync(filename)
        const name = names.find(x => nameList.includes(x))
        if (name) {
          filename = nps.join(filename, name)
        }
      }

      if (isHit(filename)) {
        const sse = factory.get(filename)
        sse.handler(req, res)

        req.on('close', function() {
          if (!sse.size()) {
            factory.remove(filename)
          }
        })

        factory.watch(filename)
        return
      }

      next()
    },
    factory
  }
}

module.exports = liveMarkdownMiddleware
