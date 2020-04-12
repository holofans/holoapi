const consts = require('./consts');
const envs = require('./envs');
const firestore = require('./firestore');
const memcached = require('./memcached');
const youtube = require('./youtube');
const logger = require('./logger');
const settings = require('./settings');

module.exports = (function() {
  const envValues = envs();
  return {
    consts: consts(),
    env: envValues,
    settings: settings(envValues.APP_SETTINGS),
    log: logger(envValues.NODE_ENV),
    YouTube: youtube(envValues.GOOGLE_API_KEY),
    Firestore: firestore(envValues.GOOGLE_SERVICE_JSON),
    Memcached: memcached(envValues.MEMCACHED_CLUSTERIP),
  };
})();
