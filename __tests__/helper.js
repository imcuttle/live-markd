/**
 * @file helper
 */

const nps = require('path')

function fixture(name = '') {
  return nps.join(__dirname, 'fixture', name)
}

module.exports = {
  fixture
}
