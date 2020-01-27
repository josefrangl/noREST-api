const uuidv1 = require('uuid/v1');
const crypto = require('crypto');

const createModel = require('../../utils/modelGenerators').createModel;

const ApiModel = require('../../models/logistics/logisticsModel');
const redis = require('../../db/redis/redis');

const redisPrefix = 'api-';


exports.createApi = async ctx => {

  const data = ctx.request.body;
  const result = await createModel(data);

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
      const redisApi = redis.set(redisPrefix + data.api.name, `${apiKey}:${apiSecretKey}`);
      const api = await ApiModel.create({
        api_name: data.api.name,
        description: data.api.description,
        user: data.user.id,
        api_key: apiKey,
        api_secret_key: apiSecretKey
      });

      ctx.body = api;
      ctx.status = 201;
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
    const api = await ApiModel.findOne({ api_name: apiName });
    if (api) {
      ctx.status = 200;
      ctx.body = api;
    } else {
      ctx.body = 'No APIs found with that name.';
      ctx.status = 204;
    }
  } catch (error) {
    console.log('Error fetching API: ', error);
    ctx.body = 'Error fetching API from database.'
    ctx.status = 503;
  }
};

exports.getUserApis = async ctx => {
  userId = ctx.params.user_id;
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











