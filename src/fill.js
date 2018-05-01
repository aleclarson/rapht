
import $ from 'umbrella'

import {svg} from './utils'

// Fill the space under a line.
export class UnderFill {
  constructor(view, config) {
    this.node = $(svg('polygon'))
    this.view = view

    if (Array.isArray(config)) {
      if (config.length < 2) {
        throw Error('Gradient fill must have 2+ stops')
      }
      this._stops = config
    } else if (typeof config == 'string') {
      this.node.style.fill = config
    } else {
      throw TypeError('Expected an array or string')
    }
  }
  _addStops(stops, $fill) {
    const count = stops.length
    const first = stops[0]
    const last = stops[count - 1]
    $fill.attr({
      x1: first.x,
      y1: first.y,
      x2: last.x,
      y2: last.y,
    })
    for (let i = 0; i < count; i++) {
      const stop = stops[i]
      let {offset} = stop
      if (offset == null) {
        if (i == 0) {
          offset = 0
        } else if (stop == last) {
          offset = 1
        }
      }
      $(svg('stop')).attr({
        offset,
        stopColor: stop.color,
        stopOpacity: stop.opacity,
      }).appendTo($fill)
    }
  }
  _render(data) {
    const {node, view} = this
    const graph = view._graph

    if (!data.length) {
      node.attr('points', null)
      return
    }

    if (this._stops && !this._gradient) {
      const $fill = $(svg('linearGradient'))
      this._addStops(this._stops, $fill)
      this._gradient = graph._define($fill)
      node.style.fill = 'url(#' + $fill.attr('id') + ')'
    }

    const first = data[0].slice(0, 1 + data[0].indexOf(',')) + graph.height
    const last = data[data.length - 1]
    data.push(last.slice(0, 1 + last.indexOf(',')) + graph.height)

    node.attr('points', first + ' ' + data.join(' '))
    if (!node.parentNode) view.node.before(node)
  }
  _clear() {
    this.node.attr('points', null)
  }
  _detach() {
    this.node.remove()
    if (this._gradient) {
      this._gradient.remove()
    }
  }
}
