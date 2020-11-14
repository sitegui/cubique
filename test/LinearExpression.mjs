import assert from 'assert'
import { Fraction } from '../src/Fraction.mjs'
import { LinearExpression, Variable, VariableFactory } from '../src/LinearExpression.mjs'

describe('LinearExpression', function () {
  it('should create variables as needed', function () {
    const variables = new VariableFactory()
    assert.strictEqual(variables.nextVariable().name, 'a')
    assert.strictEqual(variables.nextVariable().name, 'b')
    assert.strictEqual(variables.nextVariable().name, 'c')
  })

  it('should do some basic operations', function () {
    const one = LinearExpression.one()
    assert.strictEqual(one.toString(), '1')

    const x = LinearExpression.variable(new Variable('x'))
    assert.strictEqual(x.toString(), 'x')

    assert.strictEqual((one.add(x).toString()), '1 + x')
    assert.strictEqual((one.add(x).add(one).add(x).toString()), '2 + 2 x')

    const halfFraction = new Fraction(1, 2)
    const halfExpression = one.mul(halfFraction)
    assert.strictEqual((one.add(x).mul(halfFraction).add(halfExpression).toString()), '1 + 1/2 x')
  })

  it('should solve simple equations', function () {
    // Solve `x = 1 + 2 a + 3 b`
    const x = new Variable('x')
    const a = new Variable('a')
    const b = new Variable('b')
    const expr = LinearExpression.one()
      .add(LinearExpression.variable(a).mul(new Fraction(2, 1)))
      .add(LinearExpression.variable(b).mul(new Fraction(3, 1)))

    assert.strictEqual(expr.solveEqualsTo(x).toString(), '1 + 2 a + 3 b')

    // Solve `a = 6/7 + 4/5 * a + 2/3 * b`
    const expr2 = LinearExpression.one().mul(new Fraction(6, 7))
      .add(LinearExpression.variable(a).mul(new Fraction(4, 5)))
      .add(LinearExpression.variable(b).mul(new Fraction(2, 3)))

    assert.strictEqual(expr2.solveEqualsTo(a).toString(), '30/7 + 10/3 b')
  })
})
