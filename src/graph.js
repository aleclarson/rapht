
import $ from 'umbrella'

import {PrimaryAxis} from './axis'
import {svg} from './utils'

export class Graph {
  constructor(data, config) {
    const width = config.width || 0
    const height = config.height || 0

    this.el = $(svg())
    this.data = data
    this.width = width
    this.height = height
    this.min = 0
    this.max = 0
    this.x = new PrimaryAxis()

    this._views = []
  }
  get range() {
    return this.max - this.min
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
        view._graph = null
        view.el.remove()
      }
    }
    return this
  }
  render() {
    let min = Infinity
    let max = -Infinity
    let strokeWidth = 0
    this._views.forEach(view => {
      if (!view._data) view._update()
      if (view.min < min) min = view.min
      if (view.max > max) max = view.max
      if (view._width > strokeWidth) {
        strokeWidth = view._width
      }
      requestAnimationFrame(() => view._render())
    })
    this.min = min
    this.max = max
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
      this._views.forEach(view => view._render())
    }
  }
}

function connectView(view, graph) {
  if (!view.el) throw Error('`el` property must exist')
  if (view.el.length != 1) throw Error('`el.length` must equal one')
  if (!view._graph) {
    view._graph = this
  } else if (view._graph == graph) {
    throw Error('Element already exists in this graph')
  } else {
    throw Error('Element already used in another graph')
  }
}
