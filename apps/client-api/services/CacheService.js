const { log, memcached } = require('../../../modules');

class CacheService {
  async getFromCache(key) {
    try {
      const cache = await memcached.get(key);
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
      await memcached.set(key, JSON.stringify(data), ttl);
    } catch (e) {
      log.error(`Error saving to cache: ${e.message}`);
    }
  }
}

module.exports = new CacheService();
