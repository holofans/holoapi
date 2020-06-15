const db = require('./db');
const log = require('./logger');
const youtube = require('./youtube');
const error = require('./error');

module.exports = {
  ...error,
  db,
  log,
  youtube,
};
