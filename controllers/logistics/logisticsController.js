const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

const createModel = require('../../utils/modelGenerator').createModel;

const ApiModel = require('../../models/logistics/logisticsModel');
const redis = require('../../db/redis/redis');

const redisPrefix = 'api-';

const forbiddenNames = ['api', 'apis', 'user', 'users'];

exports.verifyApiName = async ctx => {
  const data = ctx.request.body;
  console.log(data.name)
  if (!data.name) {
    ctx.body = 'Please send an api name.'
    return ctx.satus = 400;
  } else if (forbiddenNames.includes(data.name)) {
    ctx.body = 'Please choose a valid name for your api'
    return ctx.status = 400;
  }
  const exists = await redis.get(redisPrefix + data.name);
  if (exists) {
    ctx.body = 'An api with this name already exists';
    ctx.status = 202;
  } else if (!exists) {
    ctx.body = 'Good to go!';
    ctx.status = 200;
  }
}


exports.createApi = async ctx => {

  const data = ctx.request.body;

  // generate access keys (To be model)
  const apiKey = uuidv1();
  const apiSecretKey = crypto.randomBytes(32).toString('hex');

  console.log(apiKey, apiSecretKey);

  try {
    const exists = await redis.get(redisPrefix + data.api.name);
    if (exists) {
      ctx.body = 'An api with this name already exists';
      ctx.status = 202;
    } else {
      console.log(data);
      const result = await createModel(data);
      const redisApi = await redis.set(redisPrefix + data.api.name, `${data.api.public}:${apiKey}:${apiSecretKey}`);
      if (redisApi) {
        const api = await ApiModel.create({
          api_name: data.api.name,
          description: data.api.description,
          user: data.api.user,
          public: data.api.public,
          api_key: apiKey,
          api_secret_key: apiSecretKey
        });

        ctx.body = api;
        ctx.status = 201;
      }
    }

  } catch (error) {
    console.log('Error saving api to the database: ', error);
    ctx.status = 400;
  }
};

exports.adminGetAllApi = async ctx => {
  console.log('ctx');
  try {
    const apiList = await ApiModel.find({});
    ctx.body = apiList;
    ctx.status = 200;
  } catch (error) {
    console.log('Error fetching all APIs for admin: ', e);
    ctx.status = 400;
  }
};

exports.getApi = async ctx => {
  apiName = ctx.params.api_name;
  try {
    const exists = await redis.get(redisPrefix + apiName);
    if (!exists) {
      console.log(apiName)
      ctx.body = 'No APIs found with that name.';
      ctx.status = 200;
    } else {
      const api = await ApiModel.findOne({ api_name: apiName });
      ctx.status = 200;
      ctx.body = api;
    }
  } catch (error) {
    console.log('Error fetching API: ', error);
    ctx.body = 'Error fetching API from database.'
    ctx.status = 503;
  }
};

exports.getUserApis = async ctx => {
  userId = ctx.params.user_id; // send from frontend
  console.log('ctx.params   ', ctx.params)
  try {
    const userApis = await ApiModel.find({ user: userId });
    ctx.status = 200;
    if (userApis) {
      ctx.body = userApis;
    } else {
      ctx.body = 'No APIs found for that user.';
      ctx.status = 204;
    }
  } catch (error) {
    console.log('Error fetching user APIs: ', error);
    ctx.body = 'Error fetching user APIs from database.'
    ctx.status = 503;
  }
};

exports.deleteApi = async ctx => {
  apiName = ctx.params.api_name;
  try {
    const redisDelete = await redis.delete(redisPrefix + apiName);
    const api = await ApiModel.findOneAndDelete({ api_name: apiName });
    if (api) {
      ctx.body = api;
      ctx.status = 200;
    } else {
      ctx.body = 'No APIs found with that name.';
      ctx.status = 204;
    }
  } catch (error) {
    console.log('Error deleting API: ', error);
    ctx.body = 'Error deleting API from database.'
    ctx.status = 503;
  }
};











