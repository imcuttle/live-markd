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

  it('should md-detect-changed works diff-multi-list', () => {
    expect(runDetect('diff-multi-list')).toMatchInlineSnapshot(`
"<p>readme</p>
<ul>
<li>fooo</li>
<li>fooo</li>
<li class=\\"detected-updated\\">fooo</li>
<li>fooo</li>
</ul>
<p>asdasd</p>"
`)
  })
})
