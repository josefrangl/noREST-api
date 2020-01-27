const redis = require('../db/redis/redis');

const apiPrefix = 'api-';

const authenticateAccess = async (ctx, next) => {
  const apiName = ctx.params.api_name;
  const api = await redis.get(apiPrefix + apiName);
  if (!api) {
    ctx.body = `There is no api with the name: ${apiName}.`;
    ctx.status = 200;
  } else {
    const apiArray = api.split(':')
    const public = apiArray[0];
    const apiKey = apiArray[1];
    const apiSecretKey = apiArray[2];
    console.log('staus', public);
    if (public === 'true' && ctx.request.method === 'GET') {
      await next();
    } else if (public === 'false' && ctx.request.headers[apiKey] === apiSecretKey) {
      await next();
    } else {
      ctx.body = 'You do not have the right permissions to access this api.'
      ctx.status = 200;
    }
  }
}

module.exports = authenticateAccess;