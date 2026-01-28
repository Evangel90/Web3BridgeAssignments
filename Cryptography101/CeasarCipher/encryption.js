export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const charToNum = Object.fromEntries(alphabet.map((char, index) => [char, index + 1]));
export const numToChar = Object.fromEntries(alphabet.map((char, index) => [index + 1, char]));

function encrypt(message, shift) {
  return message
    .toUpperCase()
    .split('')
    .map(char => {
      if (charToNum[char]) {
        // Get position (1-26), apply shift with modulo, ensure result is 1-26
        const num = charToNum[char];
        const shifted = ((num - 1 + shift) % 26) + 1;
        return numToChar[shifted];
      }
      return char; // Keep non-letters unchanged
    })
    .join('');
}



// Example usage:
const message = 'WiseMrMusa';
const shift = 5;
export const encrypted = encrypt(message, shift);

console.log(`Original:  ${message}`);
console.log(`Shift:     ${shift}`);
console.log(`Encrypted: ${encrypted}`);
