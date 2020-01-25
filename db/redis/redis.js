const redis = require('redis');
const { promisify } = require('util')

const client = redis.createClient();

client.on('connect', () => {
  console.log('Redis is connected!! 💾');
})

const db = {
  get: promisify(client.get).bind(client),
  set: promisify(client.set).bind(client),
  hget: promisify(client.hget).bind(client),
  hset: promisify(client.hset).bind(client),
}

module.exports = db;