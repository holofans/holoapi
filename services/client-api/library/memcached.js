const Memcached = require('memcached');
const {promisify} = require('util');

module.exports = (MEMCACHED_CLUSTERIP) => {
  const memcached = new Memcached(`${MEMCACHED_CLUSTERIP}:11211`);

  return {
    base: memcached,
    get: promisify(memcached.get).bind(memcached),
    set: promisify(memcached.set).bind(memcached),
  };
};
