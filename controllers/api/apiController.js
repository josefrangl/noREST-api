
// API SERVER
// CONTROLLER get general
exports.getAll = async ctx => {
  // try catch
  const apiName = ctx.params.api_name;
  const model = require(`../../models/api/${apiName}`);
  const results = await model.findAll();
  ctx.body = results;
  ctx.status = 200; 
}

// load model