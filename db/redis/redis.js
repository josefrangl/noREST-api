'use strict';

const redis = require('redis');
const { promisify } = require('util');

const redisUrl = process.env.REDIS_URL || '';

const client = redis.createClient(redisUrl);

client.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('💾: Redis is connected!!');
});


const db = {
  get: promisify(client.get).bind(client),
  set: promisify(client.set).bind(client),
  exists: promisify(client.exists).bind(client),
  delete: promisify(client.del).bind(client),
  rename: promisify(client.rename).bind(client)
};

module.exports = db;


// redis does not use models, but for reference, 
// the data we are saving is in the following format:

//  key : value

//  api-<api_name> : <api_key>:<secret_api_key> 

//  user-<email> : hashed_password