const Memcached = require('memcached-promise');

module.exports = new Memcached(process.env.MEMCACHED_URL);
