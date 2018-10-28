/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
const supertest = require('supertest')
const express = require('express')
const fs = require('fs')

const liveMarkd = require('../')
const { fixture } = require('./helper')

describe('liveMarkd', function() {
  let middleware, app
  function setupServer(path, opts) {
    app = express()
    middleware = liveMarkd(fixture(), opts)
    path ? app.use(path, middleware) : app.use(middleware)
  }
  function request(path) {
    var req = supertest(app)
      .get(path)
      .buffer(false)
    var end = req.end
    req.sseEnd = function(callback) {
      req.on('error', callback).on('response', function(res) {
        Object.defineProperty(res, 'events', {
          get: function() {
            return res.text
              .trim()
              .split('\n\n')
              .map(string => {
                if (/^(data: )(.+)$/.test(string)) {
                  const prefix = RegExp.$1
                  let msg = RegExp.$2
                  try {
                    msg = JSON.parse(msg)
                  } catch (e) {}
                  return msg
                }
                return string
              })
          }
        })
        res.on('data', function(chunk) {
          res.text = (res.text || '') + chunk
        })
        process.nextTick(function() {
          req.assert(null, res, function(err) {
            callback(err, res)
          })
        })
      })

      end.call(req, function() {})
    }
    return req
  }

  describe('path: /', () => {
    jest.setTimeout(6000)
    beforeAll(() => {
      setupServer(null, { heartBeatDelay: 1000 })
    })
    afterEach(() => {
      middleware.close()
    })

    it("should response foo.md's html", function(done) {
      request('/foo.md')
        .expect(200)
        .expect('Content-Type', /^text\/html\b/)
        .end(function(err, res) {
          expect(res.res.text).toContain('<h1 id="foossssssww"><a href="#foossssssww"')
          done(err)
        })
    })

    it('should response sse', function(done) {
      request('/foo.md?sse=on')
        .expect('Content-Type', /^text\/event-stream\b/)
        .sseEnd(function(err, res) {
          if (err) done(err)
          jest.useFakeTimers()
          const es = middleware.getEventSourceMap()
          expect(es.size).toBe(1)
          expect(es.get(fixture('foo.md'))).not.toBeNull()

          es.get(fixture('foo.md')).publish('first')
          jest.advanceTimersByTime(2000)
          es.get(fixture('foo.md')).publish('last')
          jest.advanceTimersByTime(1000)

          let i = 0
          res.on('data', chunk => {
            // console.log(res.text, 'text')
            i++
            if (i === 5) {
              res.req.abort()

              es.get(fixture('foo.md')).close()
              expect(res.events).toMatchInlineSnapshot(`
Array [
  "first",
  "last",
  "💓",
  "💓",
  "💓",
]
`)
              done()
            }
          })
        })
    })

    it('should close when called', function(done) {
      request('/foo.md?sse=on')
        .expect('Content-Type', /^text\/event-stream\b/)
        .sseEnd(function(err, res) {
          if (err) done(err)
          const es = middleware.getEventSourceMap()
          expect(es.size).toBe(1)
          expect(es.get(fixture('foo.md'))).not.toBeNull()

          es.get(fixture('foo.md')).publish('first')
          es.get(fixture('foo.md')).publish('2')
          es.get(fixture('foo.md')).publish('3')
          es.get(fixture('foo.md')).publish('4')
          expect(es.get(fixture('foo.md')).size()).toBe(1)

          es.get(fixture('foo.md')).close()
          expect(es.get(fixture('foo.md')).size()).toBe(0)
          es.get(fixture('foo.md')).publish('last')

          res.on('end', () => {
            expect(res.events).toEqual(['first', '2', '3', '4'])
            done()
          })
        })
    })

    it('should `remove` works when called', function(done) {
      request('/foo.md?sse=on')
        .expect('Content-Type', /^text\/event-stream\b/)
        .sseEnd(function(err, res) {
          if (err) done(err)
          const es = middleware.getEventSourceMap()
          expect(es.size).toBe(1)
          expect(es.get(fixture('foo.md'))).not.toBeNull()

          es.get(fixture('foo.md')).publish('first')
          es.get(fixture('foo.md')).publish('2')
          es.get(fixture('foo.md')).publish('3')
          es.get(fixture('foo.md')).publish('4')
          expect(es.get(fixture('foo.md')).size()).toBe(1)

          middleware.remove(fixture('foo.md'))
          expect(es.get(fixture('foo.md'))).toBeUndefined()

          res.on('end', () => {
            expect(res.events).toEqual(['first', '2', '3', '4'])
            done()
          })
        })
    })

    it('should `close` works when called', function(done) {
      request('/foo.md?sse=on')
        .expect('Content-Type', /^text\/event-stream\b/)
        .sseEnd(function(err, res) {
          if (err) done(err)
          const es = middleware.getEventSourceMap()
          expect(es.size).toBe(1)
          expect(es.get(fixture('foo.md'))).not.toBeNull()

          es.get(fixture('foo.md')).publish('first')
          es.get(fixture('foo.md')).publish('2')
          es.get(fixture('foo.md')).publish('3')
          es.get(fixture('foo.md')).publish('4')
          expect(es.get(fixture('foo.md')).size()).toBe(1)

          middleware.close()
          expect(es.get(fixture('foo.md'))).toBeUndefined()

          res.on('end', () => {
            expect(res.events).toEqual(['first', '2', '3', '4'])
            done()
          })
        })
    })
  })

  describe('path: /base', () => {
    jest.setTimeout(6000)
    beforeAll(() => {
      setupServer('/base', { heartBeatDelay: 1000 })
    })
    afterEach(() => {
      middleware.close()
    })

    it('should response html', function(done) {
      request('/base/foo.md')
        .expect('Content-Type', /^text\/html\b/)
        .expect(200)
        .end((err, res) => {
          if (err) done(err)

          expect(res.res.text).toContain('<h1 id="foossssssww">')
          expect(res.res.text).toContain('foossssssww')
          done()
        })
    })

    it('should sse hearBeat', function(done) {
      request('/base/foo.md?sse=on')
        .expect('Content-Type', /^text\/event-stream\b/)
        .sseEnd(function(err, res) {
          if (err) done(err)
          const es = middleware.getEventSourceMap()
          expect(es.size).toBe(1)
          expect(es.get(fixture('foo.md'))).not.toBeNull()

          es.get(fixture('foo.md')).publish('first')
          jest.advanceTimersByTime(2000)
          es.get(fixture('foo.md')).publish('last')
          jest.advanceTimersByTime(1000)

          let i = 0
          res.on('data', chunk => {
            // console.log(res.text, 'text')
            i++
            if (i === 5) {
              res.req.abort()

              es.get(fixture('foo.md')).close()
              expect(res.events).toMatchInlineSnapshot(`
Array [
  "first",
  "💓",
  "💓",
  "last",
  "💓",
]
`)
              done()
            }
          })
        })
    })

    describe('watch file', () => {
      jest.setTimeout(6000)
      let contentMap, esMap, watch, watcher

      beforeAll(() => {
        setupServer('/base', { heartBeatDelay: 1000 })
      })

      beforeEach(() => {
        contentMap = middleware.getFileContentsMap()
        esMap = middleware.getEventSourceMap()
        esMap.clear()
        contentMap.clear()
        // for test only
        watch = jest.spyOn(middleware.factory, 'watch')
      })
      it('should watch file works!', function(done) {
        jest.useRealTimers()
        // lazy initialize
        expect(middleware.getWatcher()).toBeUndefined()

        request('/base/foo.md?sse=on').sseEnd((err, res) => {
          if (err) done(err)

          expect(esMap.size).toBe(1)
          expect(esMap.has(fixture('foo.md'))).toBeTruthy()
          expect(contentMap.size).toBe(0)

          expect(watch).toBeCalledTimes(1)
          expect(watch).toBeCalledWith(fixture('foo.md'))
          watcher = middleware.getWatcher()
          expect(watcher.getWatched()).toEqual({
            [fixture()]: ['foo.md']
          })
          // yield read file
          setTimeout(() => {
            expect(contentMap.size).toBe(1)
            expect(contentMap.get(fixture('foo.md'))).toEqual('# foossssssww\n')
            contentMap.set(fixture('foo.md'), '# foo')

            // trigger change
            fs.writeFileSync(fixture('foo.md'), fs.readFileSync(fixture('foo.md')))

            // yield trigger
            setTimeout(() => {
              expect(contentMap.get(fixture('foo.md'))).toEqual('# foossssssww\n')
              expect(res.events).toMatchInlineSnapshot(`
Array [
  "💓",
  Object {
    "type": "change",
    "value": "<h1 class=\\"detected-updated\\" id=\\"foossssssww\\"><a href=\\"#foossssssww\\" class=\\"anchor\\"><svg aria-hidden=\\"true\\" class=\\"octicon octicon-link\\" height=\\"16\\" version=\\"1.1\\" view-box=\\"0 0 16 16\\" width=\\"16\\"><path d=\\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\\"></path></svg></a>foossssssww</h1>",
  },
  "💓",
]
`)
              done()
            }, 1200)
          }, 1000)
        })
      })

      it('should watch file works even chinese name', function(done) {
        jest.useRealTimers()
        // lazy initialize

        request(`/base/${encodeURIComponent('中文')}.md?sse=on`).sseEnd((err, res) => {
          if (err) done(err)

          expect(esMap.size).toBe(1)
          expect(esMap.has(fixture('中文.md'))).toBeTruthy()

          expect(watch).toBeCalledTimes(1)
          expect(watch).toBeCalledWith(fixture('中文.md'))
          // yield read file
          setTimeout(() => {
            expect(contentMap.size).toBe(1)
            expect(contentMap.get(fixture('中文.md'))).toEqual('# 中文\n')
            contentMap.set(fixture('中文.md'), '# foo')

            // trigger change
            fs.writeFileSync(fixture('中文.md'), fs.readFileSync(fixture('中文.md')))

            // yield trigger
            setTimeout(() => {
              expect(contentMap.get(fixture('中文.md'))).toEqual('# 中文\n')
              expect(res.events).toMatchInlineSnapshot(`
Array [
  "💓",
  Object {
    "type": "change",
    "value": "<h1 class=\\"detected-updated\\" id=\\"中文\\"><a href=\\"#%E4%B8%AD%E6%96%87\\" class=\\"anchor\\"><svg aria-hidden=\\"true\\" class=\\"octicon octicon-link\\" height=\\"16\\" version=\\"1.1\\" view-box=\\"0 0 16 16\\" width=\\"16\\"><path d=\\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\\"></path></svg></a>中文</h1>",
  },
  "💓",
]
`)
              done()
            }, 1200)
          }, 1000)
        })
      })
    })
  })
})
