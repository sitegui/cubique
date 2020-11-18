import { Fraction } from './Fraction.mjs'
import { listCommonDivisors, listDivisors } from './divisors.mjs'

export class ValidActionRethrow {
}

export class ValidActionReduce {
  /**
   * @param {number} factor
   */
  constructor (factor) {
    this.factor = factor
  }
}

export class ValidActionTryReduce {
  /**
   * @param {number} currentFactor
   * @param {number} targetFactor
   */
  constructor (currentFactor, targetFactor) {
    this.currentFactor = currentFactor
    this.targetFactor = targetFactor
    /**
     * @type {Fraction}
     */
    this.errRate = new Fraction(currentFactor % targetFactor, currentFactor)
  }
}

export class Problem {
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
   * @returns {{err: Problem, ok: Problem, errRate: Fraction}}
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

    const errRate = new Fraction(currentFactor % targetFactor, currentFactor)

    return {
      ok,
      err,
      errRate
    }
  }

  /**
   * @returns {boolean}
   */
  isSolved () {
    return this.targetSize === 1
  }

  /**
   * @param {Problem} other
   * @returns {boolean}
   */
  isEqual (other) {
    return this.startSize === other.startSize && this.currentSize === other.currentSize && this.targetSize === other.targetSize
  }

  /**
   * @returns {string}
   */
  toString () {
    return `${this.currentSize} -> ${this.targetSize}`
  }

  /**
   * @returns {array<ValidActionRethrow|ValidActionReduce|ValidActionTryReduce>}
   */
  listValidActions () {
    const actions = []

    if (!this.isSolved()) {
      actions.push(new ValidActionRethrow())
    }

    for (const factor of listCommonDivisors(this.currentSize, this.targetSize)) {
      if (factor > 1) {
        actions.push(new ValidActionReduce(factor))
      }
    }

    const currentDivisors = listDivisors(this.currentSize)
    const targetDivisors = listDivisors(this.targetSize)
    for (const currentDivisor of currentDivisors) {
      if (currentDivisor > 1) {
        for (const targetDivisor of targetDivisors) {
          if (targetDivisor > 1 && currentDivisor > targetDivisor && currentDivisor % targetDivisor !== 0) {
            actions.push(new ValidActionTryReduce(currentDivisor, targetDivisor))
          }
        }
      }
    }

    return actions
  }

  _clone () {
    const cloned = new Problem(this.startSize, this.targetSize)
    cloned.currentSize = this.currentSize
    return cloned
  }
}
