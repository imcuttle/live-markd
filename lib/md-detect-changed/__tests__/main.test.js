/**
 * @file main
 * @author Cuttle Cong
 * @date 2018/10/27
 * @description
 *
 */
const detect = require('../')
const { fixture } = require('./helper')

const fs = require('fs')

function runDetect(name) {
  const oldMd = fs.readFileSync(fixture(name, 'old.md'))
  const newMd = fs.readFileSync(fixture(name, 'new.md'))
  return detect(oldMd, newMd)
}

describe('md-detect-changed', function() {
  it('should md-detect-changed works normal', () => {
    expect(runDetect('normal')).toContain('<p class="detected-updated">okkkk changed here</p>')
  })

  it('should md-detect-changed works diff-total', () => {
    expect(runDetect('diff-total')).toMatchInlineSnapshot(`
"<p class=\\"detected-updated\\">readme</p>
<p>fooo</p>"
`)
  })

  it('should md-detect-changed works diff-newline', () => {
    expect(runDetect('diff-newline')).toMatchInlineSnapshot(`
"<p>readme</p>
<p>fooo</p>"
`)
  })

  it('should md-detect-changed works diff-list', () => {
    expect(runDetect('diff-list')).toMatchInlineSnapshot(`
"<p>readme</p>
<ul>
<li class=\\"detected-updated\\">fooo</li>
</ul>
<p>asdasd</p>"
`)
  })

  it('should md-detect-changed works diff-new-list', () => {
    expect(runDetect('diff-new-list')).toMatchInlineSnapshot(`
"<h1 id=\\"readme\\"><a href=\\"#readme\\" class=\\"anchor\\"><svg aria-hidden=\\"true\\" class=\\"octicon octicon-link\\" height=\\"16\\" version=\\"1.1\\" view-box=\\"0 0 16 16\\" width=\\"16\\"><path d=\\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\\"></path></svg></a>readme</h1>
<ul>
<li>fooo</li>
<li class=\\"detected-updated\\">new</li>
</ul>"
`)
  })

  it('should diff-rm-list', function() {
    expect(runDetect('diff-rm-list')).toMatchInlineSnapshot(`
"<h1 id=\\"readme\\"><a href=\\"#readme\\" class=\\"anchor\\"><svg aria-hidden=\\"true\\" class=\\"octicon octicon-link\\" height=\\"16\\" version=\\"1.1\\" view-box=\\"0 0 16 16\\" width=\\"16\\"><path d=\\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\\"></path></svg></a>readme</h1>
<ul>
<li class=\\"detected-updated\\">fooo</li>
</ul>"
`)
  })

  it('should diff-rm-head', function() {
    expect(runDetect('diff-rm-head')).toMatchInlineSnapshot(`
"<h1 id=\\"readme\\"><a href=\\"#readme\\" class=\\"anchor\\"><svg aria-hidden=\\"true\\" class=\\"octicon octicon-link\\" height=\\"16\\" version=\\"1.1\\" view-box=\\"0 0 16 16\\" width=\\"16\\"><path d=\\"M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z\\"></path></svg></a>readme</h1>
<p>block block1</p>
<p class=\\"detected-updated\\">block block2</p>"
`)
  })

  it('should diff-code', function() {
    expect(runDetect('diff-code')).toMatchSnapshot()
  })
})
