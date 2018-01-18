
const noop = require('noop')

// The independent axis. Typically the x-axis.
export class PrimaryAxis {
  constructor() {
    this.read = null

    this._data = null
    this._min = 0
    this._max = 0
  }
  update(data) {
    // Perf test: https://jsperf.com/96ras2229k
    let min = Infinity
    let max = -Infinity

    const {read} = this
    if (typeof read == 'function') {
      for (let i = 0; i < data.length; i++) {
        const val = read(data[i], i)
        if (val < min) min = val
        if (val > max) max = val
      }
      const range = max - min
      this.fraction = function(index) {
        return (read(data[index], index) - min) / range
      }
    } else {
      min = 0
      max = data.length - 1
      this.fraction = function(index) {
        return index / max
      }
    }

    this._data = data
    this._min = min
    this._max = max
  }
}
