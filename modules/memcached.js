const Memcached = require('memcached-promise');
const log = require('./logger');

const memcached = new Memcached(process.env.MEMCACHED_URL, {
  timeout: 1000,
  retries: 1,
});

memcached.on('issue', (issueDetails) => {
  log.error('Issue with Memcached server', issueDetails);
});

module.exports = memcached;
