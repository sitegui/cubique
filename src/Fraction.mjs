import { greatestCommonDivisor } from './divisors.mjs'

export class Fraction {
  /**
   * @param {number} numerator
   * @param {number} denominator
   */
  constructor (numerator, denominator) {
    assertInteger(numerator)
    assertInteger(denominator)

    if (denominator < 0) {
      numerator = -numerator
      denominator = -denominator
    }

    if (numerator === 0) {
      denominator = 1
    } else {
      const gcd = greatestCommonDivisor(Math.abs(numerator), Math.abs(denominator))
      numerator = numerator / gcd
      denominator = denominator / gcd
    }

    this.numerator = numerator
    this.denominator = denominator
  }

  /**
   * @returns {Fraction}
   */
  static zero () {
    return new Fraction(0, 1)
  }

  /**
   * @returns {Fraction}
   */
  static one () {
    return new Fraction(1, 1)
  }

  /**
   * @param {Fraction} another
   * @returns {Fraction}
   */
  add (another) {
    // TODO: we could be smarter by using a proper LCM algorithm, but for our ranges it's ok
    const newDenominator = assertInteger(this.denominator * another.denominator) / greatestCommonDivisor(this.denominator, another.denominator)
    const newNumerator = this.numerator * (newDenominator / this.denominator) + another.numerator * (newDenominator / another.denominator)
    return new Fraction(newNumerator, newDenominator)
  }

  /**
   * @param {Fraction} another
   * @returns {Fraction}
   */
  sub (another) {
    return this.add(another.neg())
  }

  /**
   * @returns {Fraction}
   */
  neg () {
    return new Fraction(-this.numerator, this.denominator)
  }

  /**
   * @param {Fraction} another
   * @returns {Fraction}
   */
  mul (another) {
    return new Fraction(this.numerator * another.numerator, this.denominator * another.denominator)
  }

  /**
   * @param {Fraction} another
   * @returns {Fraction}
   */
  div (another) {
    return new Fraction(this.numerator * another.denominator, this.denominator * another.numerator)
  }

  /**
   * @returns {Fraction}
   */
  inv () {
    return new Fraction(this.denominator, this.numerator)
  }

  /**
   * @returns {Fraction}
   */
  abs () {
    return new Fraction(Math.abs(this.numerator), this.denominator)
  }

  /**
   * @param {Fraction} another
   * @return {boolean}
   */
  isEquals (another) {
    return this.numerator === another.numerator && this.denominator === another.denominator
  }

  /**
   * @return {number}
   */
  asNumber () {
    return this.numerator / this.denominator
  }

  toString () {
    return this.denominator === 1 ? String(this.numerator) : `${this.numerator}/${this.denominator}`
  }
}

/**
 * @param {any} x
 * @returns {number}
 */
function assertInteger (x) {
  if (!Number.isSafeInteger(x)) {
    throw new Error(`${x} is not an integer`)
  }
  return x
}
