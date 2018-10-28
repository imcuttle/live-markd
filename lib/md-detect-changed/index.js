/**
 * @file inde
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/27
 *
 */
const { gfmRemark } = require('github-similar-server/src/markhtml')
const walk = require('@moyuyc/walk-tree')
const isEqWith = require('lodash.isequalwith')

const getPrePaths = (context, ast) => {
  const { top, xs } = context.cursor.stack
  return xs.slice(0, top + 1).reduce((path, item, i, { length }) => {
    if (item.node) {
      let index = item.index
      // not last one means that has visited
      if (length - 1 !== i) {
        index = index - 1
      }
      path.push(index)
    }
    return path
  }, [])
}

const getPostPaths = (context, ast) => {
  const { top, xs } = context.cursor.stack
  return xs.slice(0, top + 1).reduce(
    (ctx, item, i, { length }) => {
      if (item.node) {
        let index = item.index
        ctx.paths.push(index)
        ctx.parents.push(item.node)
      }
      return ctx
    },
    { paths: [], parents: [] }
  )
}

const noPosGFM = gfmRemark().use({ settings: { position: false } })

function detect(oldMarkdown, newMarkdown, { activeClassName = 'detected-updated' } = {}) {
  let oldAst = noPosGFM.parse(oldMarkdown)
  let newAst = noPosGFM.parse(newMarkdown)

  oldAst.children = oldAst.children.reverse()
  newAst.children = newAst.children.reverse()
  const state = { updatedNode: null }
  walk(
    oldAst,
    (node, ctx) => {
      const state = ctx.state
      if (!node) {
        return
      }
      if (!node.children) {
        ctx.skip()
      }

      const { paths } = getPostPaths(ctx)
      const newParents = []

      // TODO: use dp for fast
      let isFoundInNew = false
      let ref = newAst
      for (let i = 0; i < paths.length; i++) {
        const index = paths[i]
        if (ref.children && ref.children[index]) {
          newParents.push(ref)
          ref = ref.children[index]
          isFoundInNew = true
        } else {
          // Not found in new ast
          // fallback to next -> prev -> parent
          if (ref.children) {
            ref = ref.children[index + 1] || ref.children[index - 1] || ref
          }
          isFoundInNew = false
          break
        }
      }

      // Check eq
      const stripedRef = Object.assign({}, ref, { children: null, position: null })
      const stripedNode = Object.assign({}, node, { children: null, position: null })
      if (!isFoundInNew || (isFoundInNew && !isEqWith(stripedRef, stripedNode))) {
        state.updatedNode = ref
        state.parents = newParents
        state.paths = paths
        ctx.break()
      }
    },
    { order: 'post', state }
  )

  if (state.updatedNode) {
    let node = state.updatedNode
    let pos = 0
    let par = state.parents[state.parents.length - 1 - pos]
    while (node && node.type === 'text') {
      node = state.parents[state.parents.length - 1 - pos]
      pos++
      par = state.parents[state.parents.length - 1 - pos]
      // stringify to <li>foo</li>, instead of <li><p>foo</p></li>
      if (par.type === 'listItem') {
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

  // oldAst.children = oldAst.children.reverse()
  newAst.children = newAst.children.reverse()
  return gfmRemark.stringify(noPosGFM.runSync(newAst))
}

module.exports = detect
