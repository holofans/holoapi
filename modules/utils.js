function hashCode(s) {
  let h;
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}

function updateIfSignificant(oldNumber, newNumber, minDelta) {
  if (oldNumber == null) return newNumber;
  if (!oldNumber) return newNumber;
  if (Math.abs(oldNumber - newNumber) >= minDelta) return newNumber;
  return oldNumber; // don't update
}
module.exports = { hashCode, updateIfSignificant };
