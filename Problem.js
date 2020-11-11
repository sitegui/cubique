'use strict'

class Problem {
  constructor (startSize, targetSize) {
    this.startSize = startSize
    this.currentSize = startSize
    this.targetSize = targetSize
  }

  /**
   * Returns the resulting problem after throwing the die once
   * @returns {Problem}
   */
  rethrow () {
    const problem = this._clone()
    problem.currentSize *= problem.startSize
    return problem
  }

  /**
   * Returns the resulting problems after removing a common factor from each side
   * @param factor
   * @returns {Problem}
   */
  reduce (factor) {
    if (this.currentSize % factor !== 0) {
      throw new Error(`Current size (${this.currentSize}) is not a multiple of ${factor}`)
    }
    if (this.targetSize % factor !== 0) {
      throw new Error(`Target size (${this.targetSize}) is not a multiple of ${factor}`)
    }

    const problem = this._clone()
    problem.currentSize /= factor
    problem.targetSize /= factor
    return problem
  }

  /**
   * Returns the possible results when doing an imperfect match between factor from each side
   * @param currentFactor
   * @param targetFactor
   * @returns {{err: Problem, ok: Problem, errRate: number}}
   */
  tryReduce (currentFactor, targetFactor) {
    if (this.currentSize % currentFactor !== 0) {
      throw new Error(`Current size (${this.currentSize}) is not a multiple of ${currentFactor}`)
    }
    if (this.targetSize % targetFactor !== 0) {
      throw new Error(`Target size (${this.targetSize}) is not a multiple of ${targetFactor}`)
    }
    if (currentFactor <= targetFactor) {
      throw new Error(`${currentFactor} should be larger than ${targetFactor}`)
    }
    if (currentFactor % targetFactor === 0) {
      throw new Error(`${currentFactor} should not be a multiple of ${targetFactor}`)
    }

    const ok = this._clone()
    ok.targetSize /= targetFactor
    ok.currentSize /= currentFactor

    const err = this._clone()
    err.currentSize /= currentFactor

    const errRate = (currentFactor % targetFactor) / currentFactor

    return {
      ok,
      err,
      errRate
    }
  }

  _clone () {
    const cloned = new Problem(this.startSize, this.targetSize)
    cloned.currentSize = this.currentSize
    return cloned
  }
}
