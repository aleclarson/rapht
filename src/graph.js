
import shortId from 'short-id'
import $ from 'umbrella'

import {PrimaryAxis} from './axis'
import {svg} from './utils'

export class Graph {
  constructor(config = {}) {
    this.el = $(svg())
    this.data = config.data || null
    this.width = config.width || 0
    this.height = config.height || 0
    this.min = 0
    this.max = 0
    this.x = new PrimaryAxis()

    this._views = []
    this._stroke = 0
    this._resize()
  }
  get range() {
    return this.max - this.min
  }
  valueOf(dataIdx, viewIdx) {
    const view = this._views[viewIdx || 0]
    return view ? view.valueOf(dataIdx) : null
  }
  position(value) {
    const yp = 1 - (value - this.min) / this.range
    return this._stroke + yp * this.height
  }
  add() {
    for (let i = 0; i < arguments.length; i++) {
      const view = arguments[i]
      if (view) {
        connectView(view, this)
        this.el.append(view.el)
        this._views.push(view)
      }
    }
    return this
  }
  remove() {
    for (let i = 0; i < arguments.length; i++) {
      const view = arguments[i]
      if (view && view._graph == this) {
        this._views.splice(this._views.indexOf(view), 1)
        view._data = null
        view._graph = null
        view._detach()
      }
    }
    return this
  }
  render(data) {
    if (Array.isArray(data)) {
      this.data = data
    } else if (arguments.length) {
      throw TypeError('Expected an array')
    }

    if (!this.x._data) {
      if (this.data) {
        this.x.update(this.data)
      } else {
        throw Error('Cannot render the x-axis without data')
      }
    }

    let min = Infinity
    let max = -Infinity
    let stroke = 0

    this._views.forEach(view => {
      if (!view._data) {
        const data = view.data || this.data
        if (data) {
          view._update(data)
        } else {
          throw Error('Cannot render a view without data')
        }
      }
      if (typeof view._stroke == 'number') {
        if (view._stroke > stroke) stroke = view._stroke
      }
      if (view.min < min) min = view.min
      if (view.max > max) max = view.max
    })

    this.min = min
    this.max = max

    // Resize the graph if the max stroke changed.
    if (this._stroke != stroke) {
      this._stroke = stroke
      this._resize()
    }

    this._render()
    return this
  }
  resize(width, height) {
    let changed = false

    if (width != null && this.width != width) {
      changed = true
      this.width = width
    }

    if (height != null && this.height != height) {
      changed = true
      this.height = height
    }

    if (changed) {
      this._resize()
      this._render()
    }

    return this
  }
  _resize() {
    this.el.attr('viewBox', [
      0, -this._stroke, this.width,
      this.height + 2 * this._stroke
    ].join(' ')).style.width = this.width
  }
  _render() {
    if (!this._rendering) {
      const views = this._views.slice()
      this._rendering = requestAnimationFrame(() => {
        views.forEach(view => view._graph == this && view._render())
        this._rendering = null
      })
    }
  }
  _define(node) {
    let $defs = this.el.children().first('defs')
    if ($defs.length == 0) {
      $defs = $(svg('defs')).prependTo(this.el)
    }
    return $(node)
      .attr('id', shortId(10))
      .appendTo($defs)
  }
}

function connectView(view, graph) {
  if (!view.el) throw Error('`el` property must exist')
  if (view.el.length != 1) throw Error('`el.length` must equal one')
  if (!view._graph) {
    view._graph = graph
  } else if (view._graph == graph) {
    throw Error('Element already exists in this graph')
  } else {
    throw Error('Element already used in another graph')
  }
}
