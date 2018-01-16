
const svgNS = 'http://www.w3.org/2000/svg'

export function svg(tag) {
  return document.createElementNS(svgNS, tag || 'svg')
}

export function willSet(ctr, key, hook) {
  var _key = '_' + key
  Object.defineProperty(ctr.prototype, key, {
    get() {
      return this[_key]
    },
    set(value) {
      var res = hook(value)
      if (res !== undefined) {
        this[_key] = res
      }
    }
  })
}

// function validateRange(range) {
//   return Array.isArray(range) && range.length == 2 &&
//     (range[0] === null || typeof range[0] == 'number') &&
//     (range[1] === null || typeof range[1] == 'number')
// }
