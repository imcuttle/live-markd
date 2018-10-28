/**
 * @file see
 * @author imcuttle <moyuyc95@gmail.com>
 * @date 2018/10/28
 *
 */

if (typeof EventSource === 'undefined') {
  console.error(`Because of typeof EventSource === 'undefined', So hot updating feature is disabled`)
} else {
  const source = new EventSource(location.pathname + '?sse=on')
  source.addEventListener('message', function(ev) {
    let data = {}
    try {
      data = JSON.parse(ev.data)
    } catch (e) {}

    if (data.type === 'change') {
      document.querySelector('.markdown-body').innerHTML = data.value
      const nodeList = [...document.querySelectorAll('.markdown-body .detected-updated')]
      const node = nodeList.pop()
      if (node) {
        node.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
}
