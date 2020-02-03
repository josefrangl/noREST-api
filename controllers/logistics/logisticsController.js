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
    ctx.body = { error: 'Please send an api name.' };
    ctx.status = 400;
  } else if (forbiddenNames.includes(data.name) || data.name[0] === '-' || data.name.includes(' ') || /[0-9]/.test(data.name[0])) { // so that api names are valid javascript variables
    ctx.body = { error: 'Please choose a valid name for your api.' };
    ctx.status = 202; 
  }
  const exists = await redis.get(redisPrefix + data.name);
  // so that we do not overwrite an existing model as mongoose by default creates a collection with the plural of the model name (if it doesn't end in an s)
  if (data.name[data.name.length - 1] === 's') {
    pluralExists = await redis.get(redisPrefix + data.name.slice(-1));
  }
  if (exists || pluralExists) {
    ctx.body = { error: 'An api with this name already exists.' };
    ctx.status = 202;
  } else if (!exists) {
    ctx.body = data.name;
    ctx.status = 200;
  }
};


exports.createApi = async ctx => {

  const data = ctx.request.body;

  if (!data.user || !data.api.name || !Object.prototype.hasOwnProperty.call(data.api, 'public') || data.api.fields.length < 1) {
    ctx.body = { error: 'Check your input, one field is missing.' };
    ctx.status = 202;
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
      ctx.body = { error :'An api with this name already exists.' };
      ctx.status = 202;
    } else if (forbiddenNames.includes(data.api.name) || data.api.name[0] === '-' || data.api.name.includes(' ') || /[0-9]/.test(data.api.name[0])) {
      ctx.body = { error: 'Please choose a valid name for your api.' };
      // note I jose fran changed this from 400 to 202, correct is 204, however 
      // for error handling in the frontend (until validation is done) 
      // it nees to be a 202.
      ctx.status = 202;
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

        ctx.body = api;
        ctx.status = 201;
      }
    }

  } catch (error) {
    console.error('Error saving api to the database: ', error);
    ctx.body = { error: 'Error saving api to the database' };
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
    ctx.body = { error: 'fetching all APIs for admin' };
    ctx.status = 400;
  }
};

exports.getApi = async ctx => {
  const apiName = ctx.params.api_name;
  try {
    const exists = await redis.get(redisPrefix + apiName);
    if (!exists) {
      ctx.body = { error: `No APIs found with name: ${apiName}.`};
      ctx.status = 202;
    } else {
      const api = await ApiModel.findOne({ api_name: apiName });
      ctx.status = 200;
      ctx.body = api;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching API: ', error);
    ctx.body = { error: 'Error fetching API from database.' };
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
      ctx.body = { error: 'No APIs found for that user.' };
      ctx.status = 204;
    }
  } catch (error) {
    console.error('Error fetching user APIs: ', error);
    ctx.body = { error: 'Error fetching user APIs from database.'};
    ctx.status = 503;
  }
};

exports.updateApi = async ctx => {
  const oldApiName = ctx.params.api_name;
  const data = ctx.request.body;

  // check that the api exists
  const oldName = await redis.get(redisPrefix + oldApiName);

  if (!oldName) {
    ctx.body = { error: `There is no API with the name ${oldApiName}.`}; // perhaps could validate this in the front end with the api/validate endpoint?
    return ctx.status = 202;
  }

  if (data.api_fields) {
    let updatedFields;
    if (data.api_fields.length === 1) {
      updatedFields = await ApiModel.findOneAndUpdate({ api_name: oldApiName }, { $push: { api_fields: data.api_fields } }, { new: true });
    } else {
      updatedFields = await ApiModel.findOneAndUpdate({ api_name: oldApiName }, { $push: { api_fields: { $each: data.api_fields }} }, { new: true });
    }
    if (updatedFields) {
      ctx.body = updatedFields;
      ctx.status = 200;
    }
  }

  const newApiName = data.api_name;

  // to get the values saved in redis
  const [oldPublic, oldApiKey, oldApiSecretKey] = oldName.split(':');

  // will be used later
  let redisName = oldName;
  try {

    // if the client wants to change the api name
    if (newApiName) {
      // to check if the new api name is already being used
      const newNameExists = await redis.get(redisPrefix + newApiName);
      if (newNameExists) { // or plural exists
        ctx.body = { error: 'An api with this name already exists.'}; // perhaps could validate this in the front end with the api/validate endpoint?
        return ctx.status = 202;
      }
       
      const model = require(`../../models/api/${oldApiName.toLowerCase()}Model.js`); 
      // const model = require(`../../models/api/${oldName}Model.js`);

      const apiData = await model.find({});
      let renamed;

      // if the model is created but there is no data inside
      if (apiData.length > 0) {
        const db = mongoose.connection.db;
      
        let pluralOldApiName = oldApiName;
        let pluralNewApiName = newApiName; // as model names are saved with an s so need to add an s if the api name doesn't end in one
        if (oldApiName[oldApiName.length - 1] !== 's' && !/[0-9]/.test(oldApiName[oldApiName.length - 1])) {
  
          pluralOldApiName = oldApiName + 's';
          pluralNewApiName = newApiName + 's';
        }
        // to change model name in mongodb
        renamed = await db.collection(pluralOldApiName.toLowerCase()).rename(pluralNewApiName.toLowerCase());
      }


      // if the rename worked, change the model name in the model file and rename the file itself
      if (apiData.length === 0 || renamed) {
        const oldFile = await readFileAsync(`models/api/${oldApiName.toLowerCase()}Model.js`);
        const oldModelInstantiation = `mongoose.model('${oldApiName}', `;
        const newModelInstantiation = `mongoose.model('${newApiName}', `;
        const replacedData = oldFile.toString().replace(oldModelInstantiation, newModelInstantiation);

        if (JSON.stringify(oldFile) !== JSON.stringify(replacedData)) {
          await writeFileAsync(`models/api/${oldApiName}Model.js`, replacedData);

          await renameFileAsync(`models/api/${oldApiName.toLowerCase()}Model.js`, `models/api/${newApiName.toLowerCase()}Model.js`);

          // rename the redis key and save that value
          await redis.rename(redisPrefix + oldApiName, redisPrefix + newApiName);
          redisName = redisPrefix + newApiName;
        } else {
          ctx.body = { error: 'Could not update mongoose model.' }; // perhaps could validate this in the front end with the api/validate endpoint?
          return ctx.status = 202;
        }

      }
    }

    // update the value associated with the (potentially updated) key in redis
    const newPublic = data.public || oldPublic;
    const newApiKey = data.api_key || oldApiKey;
    const newApiSecretKey = data.api_secret_key || oldApiSecretKey;

    if (Object.prototype.hasOwnProperty.call(data, 'public') || data.api_key || data.api_secret_key) await redis.set(redisName, `${newPublic}:${newApiKey}:${newApiSecretKey}`);

    let mongooseObj = {};
    for (let key in data) {
      if (data[key] !== '' && key !== 'api_fields') mongooseObj[key] = data[key];
    }

    // update the mongoose model fields
    const mongooseModelName = oldApiName || newApiName;
    const result = await ApiModel.findOneAndUpdate({ api_name: mongooseModelName }, mongooseObj, { new: true });
    if (result) {
      ctx.body = result;
      ctx.status = 200;
    } else {
      ctx.body = { error: 'ID not found.'};
      ctx.status = 202;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error updating ${oldApiName} API to be ${newApiName}`, error);
    ctx.body = { error: `Error udpating ${oldApiName} API to be ${newApiName}. Please check that your API has data.` };
    ctx.status = 500;
  }
};

exports.deleteApi = async ctx => {
  const apiName = ctx.params.api_name;
  try {
    await redis.delete(redisPrefix + apiName);
    const api = await ApiModel.findOneAndDelete({ api_name: apiName });
    const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);
    if (api) {
      const deleted = model.collection.drop();
      if (deleted) {
        ctx.body = api;
        ctx.status = 200;
      }
    } else {
      ctx.body = { error: 'No APIs found with that name.' };
      ctx.status = 202;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting API: ', error);
    ctx.body = { error: 'Error deleting API from database.' };
    ctx.status = 503;
  }
};

exports.deleteApiData = async (ctx) => {
  const apiName = ctx.params.api_name.toLowerCase();
  const model = require(`../../models/api/${apiName}Model.js`);
  try {
    const exists = await redis.get(redisPrefix + apiName);
    if (!exists) {
      ctx.body = { error: `No APIs found with name: ${apiName}.` };
      ctx.status = 202;
    } else {
      const deleted = await model.deleteMany({});
      ctx.body = deleted;
      ctx.status = 200;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error deleting data from API: ', apiName);
    ctx.body = { error: 'Error deleting API data from database.' };
    ctx.status = 503;
  }
};

exports.generateNewApiKeys = async (ctx) => {
  const apiName = ctx.params.api_name;
  const newApiKey = uuidv1();
  const newApiSecretKey = crypto.randomBytes(32).toString('hex');

  const keysObj = {
    api_key: newApiKey,
    api_secret_key: newApiSecretKey
  };
  
  try {
    const redisName = await redis.get(redisPrefix + apiName);
    if (!redisName) {
      ctx.body = { error: `No APIs found with name: ${apiName}.` };
      ctx.status = 202;
    } else {
      const oldPublic = redisName.split(':')[0];
      await redis.set(redisPrefix + apiName, `${oldPublic}:${newApiKey}:${newApiSecretKey}`);
      const result = await ApiModel.findOneAndUpdate({ api_name: apiName }, keysObj, { new: true });
      ctx.body = result;
      ctx.status = 202;

    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error creating new api keys');
    ctx.body = { error: 'Error creating new api keys' };
    ctx.status = 503;
  }
};

exports.getPublicApis = async (ctx) => { 
  try {
    const apiList = await ApiModel.find( { public: true });
    ctx.body = apiList;
    ctx.status = 200;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error fetching all public APIs for admin: ', error);
    ctx.body = { error: 'fetching all public APIs for admin' };
    ctx.status = 400;
  }
};