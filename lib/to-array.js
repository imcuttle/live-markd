/**
 * @file to-array
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */

module.exports = function(arr) {
  if (Array.isArray(arr)) {
    return arr
  }
  return [arr]
}
