const redis = require('../db/redis/redis');

const apiPrefix = 'api-';

const authenticateAccess = async (ctx, next) => {
  const apiName = ctx.params.api_name;
  const api = await redis.get(apiPrefix + apiName);
  if (!api) {
    ctx.body = `There is no api with the name: ${apiName}.`;
    ctx.status = 200;
  } else {
    const [public, apiKey, apiSecretKey] = api.split(':');
    if (public === 'true' && ctx.request.method === 'GET') {
      await next();
    } else if (public === 'false' && ctx.request.headers.API_KEY === apiKey && ctx.request.headers.API_SECRET_KEY === apiSecretKey) {
      await next();
    } else {
      ctx.body = 'You do not have the right permissions to access this api.'
      ctx.status = 200;
    }
  }
}

module.exports = authenticateAccess;