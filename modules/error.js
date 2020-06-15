class GenericError extends Error {
  constructor(message, data) {
    super(message);
    this.data = data;
  }

  toString() {
    return `${super.toString()} | ${JSON.stringify(this.data)}`;
  }
}

module.exports = {
  GenericError,
};
