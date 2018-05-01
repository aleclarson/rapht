
import isObject from 'is-object'
import shortId from 'short-id'
import dum from 'weaver/dum'
import $ from 'umbrella'

import {PrimaryAxis} from './axis'
import {svg} from './utils'

export class Graph {
  constructor(config = {}) {
    this.node = $(svg())
    this.data = config.data || null
    this.width = config.width || 0
    this.height = config.height || 0
    this.padding = validatePadding(config.padding || {})
    this.min = 0
    this.max = 0
    this.x = new PrimaryAxis()

    this._views = []
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
    return this.padding.top +
      this.height * (1 - (value - this.min) / this.range)
  }
  add() {
    for (let i = 0; i < arguments.length; i++) {
      const view = arguments[i]
      if (view) {
        if (!view._graph) {
          view._graph = this
        } else if (view._graph == this) {
          throw Error('Cannot add same view twice')
        } else {
          throw Error('Cannot share views between two graphs')
        }
        view._attach(this.node)
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
  clear() {
    if (this._rendered) {
      this._rendered = false
      this.data = null
      this.min = 0
      this.max = 0
      this.x._clear()
      this._views.forEach(view => view.clear())
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

    this._views.forEach(view => {
      if (!view._data) {
        const data = view.data || this.data
        if (data) {
          view._update(data)
        } else {
          throw Error('Cannot render a view without data')
        }
      }
      if (view.min < min) min = view.min
      if (view.max > max) max = view.max
    })

    this.min = min
    this.max = max

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
      dum.render(() => this._resize())
      if (this._rendered) this._render()
    }

    return this
  }
  _resize() {
    let {node, width, height, padding} = this
    height += padding.top + padding.bottom
    node.style.width = width
    node.style.height = height
    node.attr('viewBox', [
      0, -padding.top, width, height
    ].join(' '))
  }
  _render() {
    if (!this._renderer) {
      const views = this._views.slice()
      this._renderer = dum.render(() => {
        this._renderer = null
        views.forEach(view => view._data && view._render())
        this._rendered = true
      })
    }
  }
  _define(node) {
    let $defs = this.node.children().first('defs')
    if ($defs.length == 0) {
      $defs = $(svg('defs')).prependTo(this.node)
    }
    return $(node)
      .attr('id', shortId(10))
      .appendTo($defs)
  }
}

function validatePadding(padding) {
  if (!isObject(padding)) {
    throw TypeError('Expected an object')
  }
  if (typeof padding.top != 'number') {
    padding.top = 0
  }
  if (typeof padding.bottom != 'number') {
    padding.bottom = 0
  }
  if (typeof padding.left == 'number') {
    throw Error('`padding.left` is not yet supported')
  }
  if (typeof padding.right == 'number') {
    throw Error('`padding.right` is not yet supported')
  }
  return padding
}
