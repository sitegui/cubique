import assert from 'assert'
import { listDivisors, listCommonDivisors } from '../divisors.mjs'

describe('listDivisors', function () {
  it('should return the expected divisors in ascending order', function () {
    assert.deepStrictEqual(listDivisors(1), [1])
    assert.deepStrictEqual(listDivisors(10), [1, 2, 5, 10])
    assert.deepStrictEqual(listDivisors(210), [1, 2, 3, 5, 6, 7, 10, 14, 15, 21, 30, 35, 42, 70, 105, 210])

    for (const prime of [2, 3, 5, 7, 12347]) {
      assert.deepStrictEqual(listDivisors(prime), [1, prime])
      assert.deepStrictEqual(listDivisors(prime * prime), [1, prime, prime * prime])
    }
  })
})

describe('listCommonDivisors', function () {
  it('should return the expected divisors in ascending order', function () {
    assert.deepStrictEqual(listCommonDivisors(1, 1), [1])
    assert.deepStrictEqual(listCommonDivisors(10, 10), [1, 2, 5, 10])
    assert.deepStrictEqual(listCommonDivisors(210, 210), [1, 2, 3, 5, 6, 7, 10, 14, 15, 21, 30, 35, 42, 70, 105, 210])
    assert.deepStrictEqual(listCommonDivisors(12, 34), [1, 2])
    assert.deepStrictEqual(listCommonDivisors(34, 12), [1, 2])

    for (const prime of [2, 3, 5, 7, 12347]) {
      assert.deepStrictEqual(listCommonDivisors(1, prime), [1])
      assert.deepStrictEqual(listCommonDivisors(prime, prime), [1, prime])
      assert.deepStrictEqual(listCommonDivisors(prime, prime * prime), [1, prime])
    }
  })
})
