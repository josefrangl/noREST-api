const redis = require('../db/redis/redis');

const apiPrefix = 'api-';

const authenticateAccess = async (ctx, next) => {
  const apiName = ctx.params.api_name;
  const api = await redis.get(apiPrefix + apiName);

  if (!api) {
    ctx.body = `There is no api with the name: ${apiName}.`;
    ctx.status = 200;
  } else {
    
    // keys from database
    const [public, apiKey, apiSecretKey] = api.split(':');
    //keys from request
    const { api_key, api_secret_key } = ctx.request.headers;

    if (public === 'true' && ctx.request.method === 'GET') await next();
    else if (api_key === apiKey && api_secret_key === apiSecretKey) await next();
    else {
      ctx.body = 'You do not have the right permissions to access this api.'
      ctx.status = 403;
    }
  }
}

module.exports = authenticateAccess;