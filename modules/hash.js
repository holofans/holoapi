function hashCode(s) {
  let h;
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return h;
}
module.exports = { hashCode };
