
import $ from 'umbrella'
import noop from 'noop'

import {round, svg} from './utils'

// capType: butt|round|square
// joinType: miter|round|bevel

export class Line {
  constructor(config) {
    const el = $(svg('polyline'))
    const attrs = {
      'fill': 'none',
      'class': config.class,
      'stroke': config.color || '#000',
      'stroke-width': config.width || 2,
      'stroke-linecap': config.capType || 'round',
      'stroke-linejoin': config.joinType || 'round',
    }

    this.el = el.attr(attrs)
    this.name = config.name || null
    this.read = config.read || null
    this.data = config.data || null

    this._width = attrs['stroke-width']
    this._graph = null
  }
  read(index) {
    return
  }
  update(data) {
    if (!Array.isArray(data)) {
      throw TypeError('Expected an array')
    }
    this._update(data)
    this._render()
  }
  _update(data) {
    if (!data) data = this._graph.data

    // Perf test: https://jsperf.com/96ras2229k
    let min = Infinity
    let max = -Infinity

    let points
    const {read} = this
    if (typeof read == 'function') {
      points = []
      for (let i = 0; i < data.length; i++) {
        const val = read(data[i], i)
        if (val > max) max = val
        if (val < min) min = val
        points.push(val)
      }
    } else {
      points = data
      for (let i = 0; i < data.length; i++) {
        const val = data[i]
        if (val > max) max = val
        if (val < min) min = val
      }
    }

    this.min = min
    this.max = max

    this._data = function() {
      this._data = data
      return points
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
      read = noop.arg
      data = this._data()
      for (let i = 0; i < data.length; i++) {
        data[i] = point(data[i], i)
      }
    } else if (this._data) {
      read = this.read || noop.arg
      data = this._data.map(point)
    } else {
      throw Error('Cannot render without data')
    }

    this.el.attr('points', data.join(' '))
  }
}
