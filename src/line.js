
import $ from 'umbrella'
import noop from 'noop'

import {round, svg} from './utils'
import {UnderFill} from './fill'

// capType: butt|round|square
// joinType: miter|round|bevel

export class Line {
  constructor(config = {}) {
    const el = $(svg('polyline'))
    const attrs = {
      'fill': 'none',
      'class': config.class,
      'stroke': config.color || 'currentColor',
      'stroke-width': config.stroke || 2,
      'stroke-linecap': config.capType || 'round',
      'stroke-linejoin': config.joinType || 'round',
    }

    this.el = el.attr(attrs)
    this.name = config.name || null
    this.read = config.read || null
    this.data = config.data || null

    if (config.fill) {
      this.fill(config.fill)
    }

    this._stroke = attrs['stroke-width']
    this._graph = null
  }
  valueOf(idx) {
    const data = this._data || this.data
    if (data && idx >= 0 && idx < data.length) {
      const val = data[idx]
      return this.read ? this.read(val, idx) : val
    }
    return null
  }
  fill(config) {
    if (arguments.length > 1) {
      config = [].slice.call(arguments)
    }
    if (this._fill) this._fill._remove()
    this._fill = new UnderFill(this, config)
  }
  update(data) {
    if (!Array.isArray(data)) {
      throw TypeError('Expected an array')
    }
    this.data = data
    this._update(data)
    this._render()
  }
  clear() {
    this._data = null
    this.el.attr('points', null)
    return this
  }
  _attach(parent) {
    this.el.appendTo(parent)
  }
  _update(data) {
    // Perf test: https://jsperf.com/96ras2229k
    let min = Infinity
    let max = -Infinity

    const read = this.read || noop.arg1
    const vals = []
    for (let i = 0; i < data.length; i++) {
      const val = read(data[i], i)
      if (val > max) max = val
      if (val < min) min = val
      vals.push(val)
    }

    this.min = min
    this.max = max

    // When `_data` is a function, the values have been read.
    this._data = function() {
      this._data = data
      return vals
    }
  }
  _render() {
    const {x, width, height, min, range} = this._graph
    function point(val, i) {
      // The y-axis values are flipped because SVG origin is top-left.
      const y = round(height * (1 - (read(val, i) - min) / range), 4)
      return round(width * x.fraction(i), 4) + ',' + y
    }

    let read, data
    if (typeof this._data == 'function') {
      read = noop.arg1
      data = this._data()
      for (let i = 0; i < data.length; i++) {
        data[i] = point(data[i], i)
      }
    } else if (this._data) {
      read = this.read || noop.arg1
      data = this._data.map(point)
    } else {
      throw Error('Cannot render without data')
    }

    this.el.attr('points', data.join(' '))
    if (this._fill) this._fill._render(data)
  }
  _detach() {
    this.el.remove()
    if (this._fill) {
      this._fill._detach()
    }
  }
}
