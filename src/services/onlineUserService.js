const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });
client.connect();

const ONLINE_USERS_SET = 'online_users';

async function addOnlineUser(userId) {
  await client.sAdd(ONLINE_USERS_SET, userId.toString());
}

async function removeOnlineUser(userId) {
  await client.sRem(ONLINE_USERS_SET, userId.toString());
}

async function getOnlineUsers() {
  return await client.sMembers(ONLINE_USERS_SET);
}

module.exports = {
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
};
