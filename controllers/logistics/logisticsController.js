const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const fs = require('fs');
const { promisify } = require('util');
const renameFileAsync = promisify(fs.rename);

const createModel = require('../../utils/modelGenerator').createModel;

const ApiModel = require('../../models/logistics/logisticsModel');
const redis = require('../../db/redis/redis');

const redisPrefix = 'api-';

// so that api names are not the same as javascript keywords/our own models:
const forbiddenNames = ['api', 'apis', 'user', 'users', 'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'NAN'];

exports.verifyApiName = async ctx => {
  const data = ctx.request.body;

  let pluralExists;

  if (!data.name) {
    ctx.body = 'Please send an api name.'
    return ctx.satus = 400;
  } else if (forbiddenNames.includes(data.name) || data.name[0] === '-' || data.name.includes(' ') || /[0-9]/.test(data.name[0])) { // so that api names are valid javascript variables
    ctx.body = 'Please choose a valid name for your api.'
    return ctx.status = 400;
  }
  const exists = await redis.get(redisPrefix + data.name);
  // so that we do not overwrite an existing model as mongoose by default creates a collection with the plural of the model name (if it doesn't end in an s)
  if (data.name[data.name.length - 1] === 's') {
    pluralExists = await redis.get(redisPrefix + data.name.slice(-1));
  }
  if (exists || pluralExists) {
    ctx.body = 'An api with this name already exists';
    ctx.status = 202;
  } else if (!exists) {
    ctx.body = data.name;
    ctx.status = 200;
  }
}


exports.createApi = async ctx => {

  const data = ctx.request.body;
  if (!data.api.user || !data.api.name || !data.api.public || data.api.fields.length < 1) {
    ctx.body = 'Check your input, one field is missing.';
    return ctx.status = 200;
  }

  // generate access keys (To be model)
  const apiKey = uuidv1();
  const apiSecretKey = crypto.randomBytes(32).toString('hex');

  let pluralExists;

  try {
    const exists = await redis.get(redisPrefix + data.api.name);
    // same logic as above ^^
    if (data.api.name[data.api.name.length - 1] === 's') {
      pluralExists = await redis.get(redisPrefix + data.api.name.slice(0, -1));
    }
    if (exists || pluralExists) {
      ctx.body = 'An api with this name already exists.';
      return ctx.status = 202;
    } else {
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
  const userId = ctx.params.user_id;

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

exports.updateApi = async ctx => {
  const apiName = ctx.params.api_name;
  const data = ctx.request.body;
  let redisName = redisPrefix + apiName;
  const redisValue = await redis.get(redisName);
  const [oldPublic, oldApiKey, oldApiSecretKey] = redisValue.split(':');
  try {
    if (data.api_name) {
      const exists = await redis.get(redisPrefix + data.api_name);
      if (exists) {
        ctx.body = 'An api with this name already exists.'; // perhaps could validate this in the front end with the api/validate endpoint?
        return ctx.status = 200;
      }
      await redis.rename(redisPrefix + apiName, redisPrefix + data.api_name);
      redisName = redisPrefix + data.api_name;
      await renameFileAsync(`models/api/${apiName.toLowerCase()}Model.js`, `models/api/${data.api_name.toLowerCase()}Model.js`)
    }
    if (data.hasOwnProperty('public')) await redis.set(redisName, `${data.public}:${oldApiKey}:${oldApiSecretKey}`);
    if (data.api_key) await redis.set(redisName, `${oldPublic}:${data.api_key}:${oldApiSecretKey}`);
    if (data.api_secret_key) await redis.set(redisName, `${oldPublic}:${oldApiKey}:${data.api_secret_key}`);
    const result = await ApiModel.findOneAndUpdate({ api_name: apiName }, data, { new: true });
    if (result) {
      ctx.body = result;
      ctx.status = 200;
    } else {
      ctx.body = 'ID not found.';
      ctx.status = 404;
    }
  } catch (error) {
    console.log(`Error updating ${apiName} API`, error);
    ctx.body = `Error udpating ${apiName} API`;
    ctx.status = 500;
  }
}

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











