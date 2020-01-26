// To install redis:
// $ brew install redis

// To start up with redis server:
// $ brew services start redis

// To check if the server is connected do:
// $ redis-cli ping     --> it should reply with PONG if the connection goes through

// In another terminal if you want to open a redis connection:
// $ redis-cli

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