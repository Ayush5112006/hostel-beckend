/**
 * Simple in-memory cache with TTL (time-to-live)
 * Reduces repeated database queries for the same data
 */

const cache = new Map();

function set(key, value, ttlMs = 5 * 60 * 1000) {
  // Default TTL: 5 minutes
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function get(key) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }

  return item.value;
}

function invalidate(key) {
  cache.delete(key);
}

function invalidatePattern(pattern) {
  // Invalidate all keys matching a pattern (regex)
  for (const key of cache.keys()) {
    if (pattern.test(key)) {
      cache.delete(key);
    }
  }
}

function clear() {
  cache.clear();
}

function getStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  };
}

module.exports = {
  set,
  get,
  invalidate,
  invalidatePattern,
  clear,
  getStats,
};
