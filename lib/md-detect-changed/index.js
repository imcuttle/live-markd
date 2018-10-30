/**
 * @file inde
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/27
 *
 */
const { gfmRemark } = require('github-similar-server/src/markhtml')
const { detectMarkdown } = require('detect-one-changed')

const noPosGFM = gfmRemark()
  .use({ settings: { position: false } })
  .freeze()

module.exports = function(oldMd, newMd) {
  const { ast } = detectMarkdown(oldMd, newMd, { wrapType: 'ast', text: false })
  return noPosGFM.stringify(noPosGFM.runSync(ast))
}
