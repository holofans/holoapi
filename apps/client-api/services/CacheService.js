const { log, memcached } = require('../../../modules');

class CacheService {
  async getFromCache(key) {
    try {
      const cache = await memcached.get(this._replaceWhitespaces(key));
      const channelCache = cache ? JSON.parse(cache) : {};
      channelCache.cached = !!Object.keys(channelCache).length;

      return channelCache;
    } catch (e) {
      log.error(`Error fetching cache: ${e.message}`);
    }
    return {};
  }

  async saveToCache(key, data, ttl) {
    try {
      await memcached.set(this._replaceWhitespaces(key), JSON.stringify(data), ttl);
    } catch (e) {
      log.error(`Error saving to cache: ${e.message}`);
    }
  }

  _replaceWhitespaces(key) {
    return key.replace(/\s/g, '_');
  }
}

module.exports = new CacheService();
