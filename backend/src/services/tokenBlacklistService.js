const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

const BLACKLIST_PREFIX = 'blacklist:';

async function blacklistToken(token, exp) {
  // exp: token'ın bitiş zamanı (timestamp)
  const ttl = exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await client.setEx(BLACKLIST_PREFIX + token, ttl, '1');
  }
}

async function isTokenBlacklisted(token) {
  const result = await client.get(BLACKLIST_PREFIX + token);
  return result === '1';
}

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
};
