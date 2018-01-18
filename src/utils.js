
const svgNS = 'http://www.w3.org/2000/svg'

export function svg(tag) {
  return document.createElementNS(svgNS, tag || 'svg')
}

export function round(x, p) {
  const q = Math.pow(10, p)
  return Math.round(q * x + q / 1e16) / q
}
