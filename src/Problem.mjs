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
   * @param {number} factor
   * @param {Fraction} errRate
   */
  constructor (factor, errRate) {
    this.factor = factor
    this.errRate = errRate
  }
}

export class Problem {
  constructor (startSize, targetSize) {
    this.startSize = startSize
    this.currentSize = 1
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
   * Returns the possible results when doing an imperfect match between a factor for both sides
   * @param factor
   * @returns {{err: Problem, ok: Problem, errRate: Fraction}}
   */
  tryReduce (factor) {
    if (this.currentSize <= factor) {
      throw new Error(`Current size (${this.currentSize}) is smaller than ${factor}`)
    }
    if (this.targetSize % factor !== 0) {
      throw new Error(`Target size (${this.targetSize}) is not a multiple of ${factor}`)
    }
    if (this.currentSize % factor === 0) {
      throw new Error(`Current size (${this.currentSize}) is a multiple of ${factor}`)
    }

    const ok = this._clone()
    ok.targetSize /= factor
    ok.currentSize = 1

    const err = this._clone()
    err.currentSize = this.currentSize % factor

    const errRate = new Fraction(this.currentSize % factor, this.currentSize)

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

    for (const factor of listDivisors(this.targetSize)) {
      if (factor > 1 && factor < this.currentSize && this.currentSize % factor !== 0) {
        const errRate = new Fraction(this.currentSize % factor, this.currentSize)
        actions.push(new ValidActionTryReduce(factor, errRate))
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
