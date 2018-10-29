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

describe('html-server', function() {
  let app

  app = express()
  app.use('/normal', liveMarkd(fixture()))
  app.use('/foo.md', liveMarkd(fixture('foo.md')))

  const request = supertest(app)

  it('should response dir view', function(done) {
    request
      .get('/normal/')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        expect(res.text).toContain('<title>Index of /normal/</title>')
        done()
      })
  })

  it('should response 中文.md html view', function(done) {
    request
      .get('/normal/' + encodeURIComponent('中文.md'))
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        expect(res.text).toContain('<h1 id="中文">')
        done()
      })
  })

  it('should base url contains', function(done) {
    request
      .get('/normal/' + encodeURIComponent('中文.md'))
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        expect(res.text).toMatch(/src="\/normal\/__live_markd__\//)
        done()
      })
  })

  it('should single file works', function(done) {
    request
      .get('/foo.md')
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err)
        expect(res.text).toContain('<h1 id="foossssssww">')
        done()
      })
  })
})
