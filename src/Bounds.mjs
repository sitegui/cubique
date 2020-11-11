/**
 * Represents an interval in the real line, with inclusive extremes.
 * An empty interval is described with `max < min`.
 * Note that when `max = min`, the interval describes a single value.
 */
export class Bounds {
  constructor (min, max) {
    this.min = min
    this.max = max
  }

  /**
   * @returns {boolean}
   */
  isEmpty () {
    return this.max < this.min
  }
}
