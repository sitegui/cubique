/**
 * Return the divisors of a given positive integer
 * @param {number} n
 * @returns {number[]}
 */
export function listDivisors (n) {
  assertPositiveInteger(n)

  const divisors = []

  // Divisors come in pairs `(a, b)`: if `a` divides `n`, then `b = n/a` also does.
  // When `n` is a perfect square, there is a "special" pair `(a, a)` with `a*a = n`
  // If we impose `a < b`, we can find the value `a` of all pairs by searching from 1 to and including `sqrt(n)`.
  const maxHalfDivisor = Math.round(Math.sqrt(n))
  for (let a = 1; a <= maxHalfDivisor; a++) {
    if (n % a === 0) {
      divisors.push(a)
    }
  }

  // Now we can find the value `b` of all the pairs, walking the calculated list in reverse so that we have `b` in
  // ascending order
  for (let i = divisors.length - 1; i >= 0; i--) {
    const a = divisors[i]
    const b = n / a
    if (b !== a) {
      divisors.push(b)
    }
  }

  return divisors
}

/**
 * Return the divisors that are common of both values
 * @param {number} n1
 * @param {number} n2
 * @returns {number[]}
 */
export function listCommonDivisors (n1, n2) {
  assertPositiveInteger(n1)
  assertPositiveInteger(n2)

  // Take the smallest and filter from its divisors
  const [small, large] = [Math.min(n1, n2), Math.max(n1, n2)]
  return listDivisors(small).filter(d => large % d === 0)
}

/**
 * Return the greatest common divisor between both values
 * @param {number} n1
 * @param {number} n2
 * @returns {number}
 */
export function greatestCommonDivisor (n1, n2) {
  assertPositiveInteger(n1)
  assertPositiveInteger(n2)

  let [remainder, other] = [Math.min(n1, n2), Math.max(n1, n2)]
  while (remainder !== 0) {
    const newRemainder = other % remainder
    other = remainder
    remainder = newRemainder
  }

  return other
}

/**
 * @param {any} x
 */
function assertPositiveInteger (x) {
  if (!Number.isSafeInteger(x) || x < 1) {
    throw new Error(`${x} is not a natural number`)
  }
}
