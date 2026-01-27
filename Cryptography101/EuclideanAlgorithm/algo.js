/**
 * Euclidean Algorithm - Finding the GCD (Greatest Common Divisor)
 * of two numbers
 */

/**
 * Euclidean Algorithm using Modulo (more efficient)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The GCD of a and b
 */
function gcdModulo(a, b) {
  // Ensure both numbers are positive
  a = Math.abs(a);
  b = Math.abs(b);

  // Continue until b becomes 0
  while (b !== 0) {
    // Replace a with b, and b with remainder of a divided by b
    let remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

/**
 * Euclidean Algorithm using Subtraction (simpler but slower)
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The GCD of a and b
 */
function gcdSubtraction(a, b) {
  // Ensure both numbers are positive
  a = Math.abs(a);
  b = Math.abs(b);

  // Continue until a and b are equal
  while (a !== b) {
    if (a > b) {
      a = a - b;
    } else {
      b = b - a;
    }
  }

  return a;
}

/**
 * Recursive implementation of Euclidean Algorithm
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The GCD of a and b
 */
function gcdRecursive(a, b) {
  // Ensure both numbers are positive
  a = Math.abs(a);
  b = Math.abs(b);

  // Base case: if b is 0, return a
  if (b === 0) {
    return a;
  }

  // Recursive case: call gcd with b and remainder of a/b
  return gcdRecursive(b, a % b);
}

// Test cases
console.log("=== Euclidean Algorithm - GCD Calculation ===\n");

const testCases = [
  { a: 48, b: 18 },
  { a: 100, b: 50 },
  { a: 17, b: 19 },
  { a: 1071, b: 462 },
];

testCases.forEach(({ a, b }) => {
  console.log(`GCD(${a}, ${b}):`);
  console.log(`  Modulo Method:     ${gcdModulo(a, b)}`);
  console.log(`  Subtraction Method: ${gcdSubtraction(a, b)}`);
  console.log(`  Recursive Method:   ${gcdRecursive(a, b)}\n`);
});

module.exports = { gcdModulo, gcdSubtraction, gcdRecursive };
