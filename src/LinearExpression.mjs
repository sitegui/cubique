import { Fraction } from './Fraction.mjs'

export class Variable {
  constructor (name) {
    this.name = name
  }
}

export class VariableFactory {
  constructor () {
    this.nextName = 'a'
  }

  nextVariable () {
    const variable = new Variable(this.nextName)
    this.nextName = String.fromCharCode(this.nextName.charCodeAt(0) + 1)
    return variable
  }
}

export class LinearExpression {
  /**
   * @param {Fraction} bias
   * @param {Map<Variable, Fraction>} weights
   */
  constructor (bias = Fraction.zero(), weights = new Map()) {
    this.bias = bias
    this.weights = weights
  }

  static one () {
    return new LinearExpression(Fraction.one())
  }

  static variable (variable) {
    return new LinearExpression(Fraction.zero(), new Map([[variable, Fraction.one()]]))
  }

  /**
   * @param {LinearExpression} another
   * @returns {LinearExpression}
   */
  add (another) {
    const bias = this.bias.add(another.bias)
    const weights = new Map(this.weights.entries())
    for (const [variable, value] of another.weights.entries()) {
      const currentValue = weights.get(variable)
      const newValue = currentValue === undefined ? value : currentValue.add(value)
      weights.set(variable, newValue)
    }
    return new LinearExpression(bias, weights)
  }

  /**
   * @param {Fraction} fraction
   * @returns {LinearExpression}
   */
  mul (fraction) {
    const bias = this.bias.mul(fraction)
    const weights = new Map()
    for (const [variable, value] of this.weights.entries()) {
      weights.set(variable, value.mul(fraction))
    }
    return new LinearExpression(bias, weights)
  }

  /**
   * @returns {LinearExpression}
   */
  clone () {
    return new LinearExpression(this.bias, new Map(this.weights.entries()))
  }

  /**
   * Solve the equation `this = variable` for `variable`
   * @param {Variable} variable
   * @returns {LinearExpression}
   */
  solveEqualsTo (variable) {
    const variableWeight = this.weights.get(variable)
    const result = this.clone()
    if (variableWeight === undefined) {
      // `this` is independent
      return result
    } else {
      // Solve `weight * variable + independent = variable`:
      // `variable = independent / (1 - weight)`
      result.weights.delete(variable)
      return result.mul(Fraction.one().sub(variableWeight).inv())
    }
  }

  toString () {
    const sortedWeights = Array.from(this.weights.entries())
    sortedWeights.sort((a, b) => a[0].name.localeCompare(b[0].name))

    let string = ''
    let first = true
    if (!this.bias.isEquals(Fraction.zero())) {
      string += this.bias.toString()
      first = false
    }

    for (const [variable, value] of sortedWeights) {
      if (value.isEquals(Fraction.zero())) {
        continue
      }

      if (first) {
        if (value.isEquals(Fraction.one())) {
          string += `${variable.name}`
        } else if (value.isEquals(Fraction.one().neg())) {
          string += `- ${variable.name}`
        } else {
          string += `${value} ${variable.name}`
        }
        first = false
      } else {
        const sign = value.denominator > 0 ? '+' : '-'
        const valueAbs = value.abs()
        if (valueAbs.isEquals(Fraction.one())) {
          string += ` ${sign} ${variable.name}`
        } else {
          string += ` ${sign} ${value.abs()} ${variable.name}`
        }
      }
    }

    return string
  }
}
