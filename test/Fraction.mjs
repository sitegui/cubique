import assert from 'assert'
import { Fraction } from '../src/Fraction.mjs'

describe('Fraction', function () {
  it('should simplify', function () {
    assert.deepStrictEqual(new Fraction(1, 2), new Fraction(10, 20))
    assert.deepStrictEqual(new Fraction(-1, 2), new Fraction(-10, 20))
    assert.deepStrictEqual(new Fraction(-1, 2), new Fraction(10, -20))
    assert.deepStrictEqual(new Fraction(1, 2), new Fraction(-10, -20))
  })

  it('should add and subtract', function () {
    assert.deepStrictEqual(new Fraction(1, 2).add(new Fraction(1, 3)), new Fraction(5, 6))
    assert.deepStrictEqual(new Fraction(1, 2).add(new Fraction(1, 6)), new Fraction(2, 3))
    assert.deepStrictEqual(new Fraction(7, 5).add(Fraction.zero()), new Fraction(7, 5))

    assert.deepStrictEqual(new Fraction(1, 2).sub(new Fraction(1, 3)), new Fraction(1, 6))
    assert.deepStrictEqual(new Fraction(1, 2).sub(new Fraction(1, 6)), new Fraction(1, 3))
    assert.deepStrictEqual(new Fraction(7, 5).sub(Fraction.zero()), new Fraction(7, 5))

    assert.deepStrictEqual(Fraction.one().add(Fraction.one()), new Fraction(2, 1))
    assert.deepStrictEqual(Fraction.one().sub(Fraction.one()), Fraction.zero())

    assert.deepStrictEqual(new Fraction(1, 12).add(new Fraction(2, 21)), new Fraction(5, 28))
  })

  it('should multiply and divide', function () {
    assert.deepStrictEqual(new Fraction(1, 2).mul(new Fraction(1, 3)), new Fraction(1, 6))
    assert.deepStrictEqual(new Fraction(7, 12).mul(new Fraction(8, 21)), new Fraction(2, 9))
    assert.deepStrictEqual(new Fraction(7, 5).mul(Fraction.one()), new Fraction(7, 5))

    assert.deepStrictEqual(new Fraction(1, 2).div(new Fraction(1, 3)), new Fraction(3, 2))
    assert.deepStrictEqual(new Fraction(7, 12).div(new Fraction(-8, 21)), new Fraction(-49, 32))
    assert.deepStrictEqual(new Fraction(7, 5).div(Fraction.one()), new Fraction(7, 5))

    assert.deepStrictEqual(Fraction.one().mul(Fraction.one()), Fraction.one())
    assert.deepStrictEqual(Fraction.one().div(Fraction.one()), Fraction.one())
  })

  it('should negate and invert', function () {
    assert.deepStrictEqual(new Fraction(-13, 27).neg(), new Fraction(13, 27))
    assert.deepStrictEqual(new Fraction(-13, 27).inv(), new Fraction(-27, 13))
  })

  it('should convert to number', function () {
    assert.deepStrictEqual(new Fraction(2, 7).asNumber(), 2 / 7)
  })
})
