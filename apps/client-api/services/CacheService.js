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

  async getStringFromCache(key) {
    try {
      const cache = await memcached.get(this._replaceWhitespaces(key));
      if (cache) return cache;
    } catch (e) {
      log.error(`Error fetching cache: ${e.message}`);
    }
    return null;
  }

  async saveToCache(key, data, ttl) {
    await this.saveStringToCache(key, JSON.stringify(data), ttl);
  }

  async saveStringToCache(key, dataString, ttl) {
    try {
      await memcached.set(this._replaceWhitespaces(key), dataString, ttl);
    } catch (e) {
      log.error(`Error saving to cache: ${e.message}`);
    }
  }

  _replaceWhitespaces(key) {
    return key.replace(/\s/g, '_');
  }
}

module.exports = new CacheService();
