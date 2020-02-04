/*
# Note

## The apiName is sent to lowercase because in the modelGenerators 
## the files is saved all in lowercase, even if the name of the api
## is not in lowercase. (maybe this should be refined idk)
*/

const csvtojson = require('csvtojson');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink); 

exports.getAll = async ctx => {
  const apiName = ctx.params.api_name;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);

  try {
    const results = await model.find({});
    ctx.body = results;
    ctx.status = 200;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error in getting all values from DB for: ${apiName} API`, error);
    ctx.body = { error: `Error in getting all values from DB for: ${apiName} API` };
    ctx.status = 500;
  }
};

exports.getByFieldAndValue = async ctx => {
  const apiName = ctx.params.api_name;
  const field = ctx.params.field;
  const value = ctx.params.value;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);

  // get query param for db -> could be gt or lte or startswith etc
  let { match } = ctx.query;

  if (match) {
    let resolvedQuery;
    if (match === 'startswith') {
      resolvedQuery = await model.find().where(field).regex(`^${value}`);
    } else if (match === 'endswith') {
      resolvedQuery = await model.find().where(field).regex(`${value}$`);
    } else if (match === 'includes') {
      resolvedQuery = await model.find().where(field).regex(value);
    } else {
      match = '$' + match;
      resolvedQuery = await model.regex({ [field]: { [match]: value } });
    }
    ctx.body = resolvedQuery;
    return ctx.status = 200;
  }

  try {
    const results = await model.find({ [field]: value });
    ctx.body = results;
    ctx.status = 200;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error in getting value by field from DB for: ${apiName} API`, error);
    ctx.body = { error: `Error in getting value by field from DB for: ${apiName} API` };
    ctx.status = 500;
  }
};

exports.postData = async ctx => {
  const apiName = ctx.params.api_name;
  const data = ctx.request.body;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);

  try {
    const results = await model.create(data);
    ctx.body = results;
    ctx.status = 200;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error inserting data into DB for: ${apiName} API`, error);
    ctx.body = { error: `Error inserting data into DB for: ${apiName} API` };
    ctx.status = 500;
  }
};

exports.updateRecord = async ctx => {
  const apiName = ctx.params.api_name;
  const data = ctx.request.body;
  const recordId = ctx.params.id;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);

  try {
    const result = await model.findOneAndUpdate({ _id: recordId }, data, { new: true });
    if (result) {
      ctx.body = result;
      ctx.status = 200;
    } else {
      ctx.body = 'ID not found.';
      ctx.status = 404;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error updating record ${recordId} from DB for: ${apiName} API`, error);
    ctx.body = { error: `Error udpating record ${recordId} from DB for: ${apiName} API` };
    ctx.status = 500;
  }
};


exports.deleteRecord = async ctx => {
  const apiName = ctx.params.api_name;
  const recordId = ctx.params.id;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);

  try {
    const result = await model.findOneAndDelete({ _id: recordId });
    if (result) {
      ctx.body = result;
      ctx.status = 200;
    } else {
      ctx.body = 'No record found with that ID.';
      ctx.status = 404;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error deleting record from DB for: ${apiName} API`, error);
    ctx.body = { error: `Error deleting record from DB for: ${apiName} API` };
    ctx.status = 500;
  }
};


exports.uploadFile = async ctx => {
  const apiName = ctx.params.api_name;
  const model = require(`../../models/api/${apiName.toLowerCase()}Model.js`);
  const filePath = ctx.files[0].path;

  try {

    const json = await csvtojson().fromFile(filePath);

    if (json) {
      // have to replace TRUE and FALSE otherwise mongoose will bnot be able to read boolean values
      const string = JSON.stringify(json);
      const replaced = string.replace('TRUE', 'true').replace('FALSE', 'false');
      const parsed = JSON.parse(replaced);
      const results = await model.create(parsed);
      if (results) {
        await unlinkAsync(filePath);
        ctx.body = results;
        ctx.status = 200;
      } else { 
        ctx.body = { error: `Could not save file to database for ${apiName} API` };
        ctx.status = 500;
      }
    } else {
      ctx.body = { error: `Could not convert file to JSON for ${apiName} API` };
      ctx.status = 500;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error uploading csv file for ${apiName} API`, error);
    ctx.body = { error: `Error uploading csv file for ${apiName} API` };
    ctx.status = 500;
  }
};
