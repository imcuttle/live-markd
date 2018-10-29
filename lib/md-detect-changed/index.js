/**
 * @file inde
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/27
 *
 */
const { gfmRemark } = require('github-similar-server/src/markhtml')
const detectChanged = require('./detectFirstChanged')

const noPosGFM = gfmRemark()
  .use({ settings: { position: false } })
  .freeze()

function detect(oldMarkdown, newMarkdown, { activeClassName = 'detected-updated' } = {}) {
  let oldAst = noPosGFM.parse(oldMarkdown)
  let newAst = noPosGFM.parse(newMarkdown)

  oldAst.children = oldAst.children.reverse()
  newAst.children = newAst.children.reverse()

  const stateOld = detectChanged(oldAst, newAst)
  const stateNew = detectChanged(newAst, oldAst)
  let oldData = stateOld.contrast
  let newData = stateNew.traverse

  if (oldData || newData) {
    oldData = Object.assign({ parents: [] }, oldData)
    newData = Object.assign({ parents: [] }, newData)

    const state = oldData.parents.length > newData.parents.length ? oldData : newData
    let node = state.node
    if (node) {
      let pos = 0
      while (node && node.type === 'text') {
        node = state.parents[state.parents.length - 1 - pos]
        pos++
        let par = state.parents[state.parents.length - 1 - pos]
        // stringify to <li>foo</li>, instead of <li><p>foo</p></li>
        if (par && par.type === 'listItem') {
          node = par
          pos++
        }
      }
      if (node) {
        const data = (node.data = node.data || {})
        const hProps = (data.hProperties = data.hProperties || {})
        hProps.className = [activeClassName].concat(hProps.className).filter(Boolean)
      }
    }
  }

  newAst.children = newAst.children.reverse()
  return gfmRemark.stringify(noPosGFM.runSync(newAst))
}

module.exports = detect
