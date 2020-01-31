const uuidv1 = require('uuid/v1');
const crypto = require('crypto');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const renameFileAsync = promisify(fs.rename);
const mongoose = require('mongoose');

const createModel = require('../../utils/modelGenerator').createModel;

const ApiModel = require('../../models/logistics/logisticsModel');
const redis = require('../../db/redis/redis');

const redisPrefix = 'api-';

// so that api names are not the same as javascript keywords/our own models:
const forbiddenNames = ['api', 'apis', 'user', 'users', 'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'NAN'];

exports.verifyApiName = async ctx => { // put this in a helper functio in utils
  const data = ctx.request.body;

  let pluralExists;

  if (!data.name) {
    ctx.body = 'Please send an api name.';
    return ctx.satus = 400;
  } else if (forbiddenNames.includes(data.name) || data.name[0] === '-' || data.name.includes(' ') || /[0-9]/.test(data.name[0])) { // so that api names are valid javascript variables
    ctx.body = 'Please choose a valid name for your api.';
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
};


exports.createApi = async ctx => {

  const data = ctx.request.body;

  if (!data.user || !data.api.name || !Object.prototype.hasOwnProperty.call(data.api, 'public') || data.api.fields.length < 1) {
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
    } else if (forbiddenNames.includes(data.user.name) || data.user.name[0] === '-' || data.user.name.includes(' ') || /[0-9]/.test(data.user.name[0])) {
      ctx.body = 'Please choose a valid name for your api.';
      return ctx.status = 400;
    } else {
      await createModel(data);
      const redisApi = await redis.set(redisPrefix + data.api.name, `${data.api.public}:${apiKey}:${apiSecretKey}`);
      if (redisApi) {
        const api = await ApiModel.create({
          api_name: data.api.name,
          description: data.api.description,
          user: data.user.id,
          public: data.api.public,
          api_key: apiKey,
          api_secret_key: apiSecretKey,
          api_fields: data.api.fields
        });

        // we insert a blank document into the collection (model) so that mongo creates the collection.
        // else the collection won't be created in mongo until the first document insertion.
        const apiName = data.api.name.toLowerCase();
        const model = require(`../../models/api/${apiName}Model.js`);
        
        // Commented out for presentation
        // await model.create({});

        ctx.body = api;
        ctx.status = 201;
      }
    }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error saving api to the database: ', error);
    ctx.status = 400;
  }
};

exports.adminGetAllApi = async ctx => {
  try {
    const apiList = await ApiModel.find({});
    ctx.body = apiList;
    ctx.status = 200;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching all APIs for admin: ', error);
    ctx.status = 400;
  }
};

exports.getApi = async ctx => {
  const apiName = ctx.params.api_name;
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
    // eslint-disable-next-line no-console
    console.log('Error fetching API: ', error);
    ctx.body = 'Error fetching API from database.';
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
    // eslint-disable-next-line no-console
    console.log('Error fetching user APIs: ', error);
    ctx.body = 'Error fetching user APIs from database.';
    ctx.status = 503;
  }
};

exports.updateApi = async ctx => {
  const oldApiName = ctx.params.api_name;
  const data = ctx.request.body;

  // check that the api exists
  const oldNameExists = await redis.get(redisPrefix + oldApiName);

  if (data.api_fields) {
    const updatedFields = await ApiModel.findOneAndUpdate({ api_name: oldApiName }, { $push: { api_fields: data.api_fields } }, { new: true });
    if (updatedFields) {
      ctx.body = updatedFields;
      return ctx.status = 200;
    }
  }

  const newApiName = data.api_name;

  if (!oldNameExists) {
    ctx.body = `There is no API with the name ${oldApiName}.`; // perhaps could validate this in the front end with the api/validate endpoint?
    return ctx.status = 200;
  }

  // to get the values saved in redis
  let redisName = redisPrefix + oldApiName;
  const redisValue = await redis.get(redisName);
  const [oldPublic, oldApiKey, oldApiSecretKey] = redisValue.split(':');
  try {

    // if the client wants to change the api name
    if (newApiName) {

      // to check if the new api name is already being used
      const newNameExists = await redis.get(redisPrefix + newApiName);
      if (newNameExists) { // or plural exists
        ctx.body = 'An api with this name already exists.'; // perhaps could validate this in the front end with the api/validate endpoint?
        return ctx.status = 200;
      }

      // to change model name in mongodb
      const db = mongoose.connection.db;
      let pluralOldApiName = oldApiName; // as model names are saved with an s so need to add an s if the api name doesn't end in one
      if (oldApiName[oldApiName.length - 1] !== 's') pluralOldApiName = oldApiName + 's';
      const renamed = await db.collection(pluralOldApiName).rename(newApiName + 's');

      // if the rename worked, change the model name in the model file and rename the file itself
      if (renamed) {
        const oldFile = await readFileAsync(`models/api/${oldApiName.toLowerCase()}Model.js`);
        const oldModelInstantiation = `mongoose.model('${oldApiName.toLowerCase()}', `;
        const newModelInstantiation = `mongoose.model('${newApiName.toLowerCase()}', `;
        const replacedData = oldFile.toString().replace(oldModelInstantiation, newModelInstantiation);

        await writeFileAsync(`models/api/${oldApiName}Model.js`, replacedData);

        await renameFileAsync(`models/api/${oldApiName.toLowerCase()}Model.js`, `models/api/${newApiName.toLowerCase()}Model.js`);

        // rename the redis key and save that value
        await redis.rename(redisPrefix + oldApiName, redisPrefix + newApiName);
        redisName = redisPrefix + newApiName;
      }
    }

    // update the fields when new ones are added
    // have to do it separately as it is a subdocument


    // update the value associated with the (potentially updated) key in redis
    const newPublic = data.public || oldPublic;
    const newApiKey = data.api_key || oldApiKey;
    const newApiSecretKey = data.api_secret_key || oldApiSecretKey;

    if (Object.prototype.hasOwnProperty.call(data, 'public') || data.api_key || data.api_secret_key) await redis.set(redisName, `${newPublic}:${newApiKey}:${newApiSecretKey}`);

    // do separate quieries for general update and push

    // update the mongoose model fields
    const mongooseModelName = oldApiName || newApiName;
    const result = await ApiModel.findOneAndUpdate({ api_name: mongooseModelName }, data, { new: true });
    if (result) {
      ctx.body = result;
      ctx.status = 200;
    } else {
      ctx.body = 'ID not found.';
      ctx.status = 404;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error updating ${oldApiName} API to be ${newApiName}`, error);
    ctx.body = `Error udpating ${oldApiName} API to be ${newApiName}`;
    ctx.status = 500;
  }
};

exports.deleteApi = async ctx => {
  const apiName = ctx.params.api_name;
  try {
    await redis.delete(redisPrefix + apiName);
    const api = await ApiModel.findOneAndDelete({ api_name: apiName });
    if (api) {
      ctx.body = api;
      ctx.status = 200;
    } else {
      ctx.body = 'No APIs found with that name.';
      ctx.status = 204;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting API: ', error);
    ctx.body = 'Error deleting API from database.';
    ctx.status = 503;
  }
};