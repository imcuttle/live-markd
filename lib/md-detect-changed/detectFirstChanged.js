/**
 * @file detectFirstChanged
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/29
 *
 */
const walk = require('@moyuyc/walk-tree')
const isEqWith = require('lodash.isequalwith')
const createCachedChildGetter = require('./createCachedChildGetter')

const getPrePaths = (context, ast) => {
  const { top, xs } = context.cursor.stack
  return xs.slice(0, top + 1).reduce(
    (ctx, item, i, { length }) => {
      if (item.node) {
        let index = item.index
        // not last one means that has visited
        if (length - 1 !== i) {
          index = index - 1
        }
        ctx.paths.push(index)
        ctx.parents.push(item.node)
      }
      return ctx
    },
    { paths: [], parents: [] }
  )
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

function detectFirstChanged(traverseAst, contrastAst) {
  const state = {}
  const dp = {}
  const refGetter = createCachedChildGetter(contrastAst, null)
  walk(
    traverseAst,
    (node, ctx) => {
      const state = ctx.state
      if (!node) {
        return
      }
      if (!node.children) {
        ctx.skip()
      }

      const { paths, parents } = getPostPaths(ctx)
      const otherParents = []

      let { ref, index, broken } = refGetter(paths, ref => {
        otherParents.push(ref)
      })

      if (broken) {
        // Not found in new ast
        // fallback to next -> prev -> parent
        if (ref.children) {
          otherParents.push(ref)
          ref = ref.children[index + 1] || ref.children[index - 1] || ref
        }
      }

      // Check eq
      //   TraverseAst     ContrastAST
      //       r               r
      //  [a]   [c]       [a,b]  [c]
      //
      // traverse order: a -> r -> c
      const stripedRef = Object.assign({}, ref, { position: null, children: null })
      const stripedNode = Object.assign({}, node, { position: null, children: null })
      if (broken || (!broken && !isEqWith(stripedRef, stripedNode))) {
        state.traverse = {
          node,
          parents: parents
        }
        state.contrast = {
          node: ref,
          parents: otherParents
        }
        ctx.break()
      }
    },
    { order: 'post', state }
  )
  return state
}

module.exports = detectFirstChanged
module.exports.getPrePaths = getPrePaths
module.exports.getPostPaths = getPostPaths
