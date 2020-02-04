const redis = require('../db/redis/redis');

const apiPrefix = 'api-';

const authenticateAccess = async (ctx, next) => {
  const apiName = ctx.params.api_name.toLowerCase();
  const api = await redis.get(apiPrefix + apiName);

  if (!api) {
    ctx.body = { error: `There is no api with the name: ${apiName}.` };
    ctx.status = 200;
  } else {
    
    // keys from database
    const [public_status, apiKey, apiSecretKey] = api.split(':');
    //keys from request
    const { api_key, api_secret_key } = ctx.request.headers;

    // will only be authorised if they have the api keys or if it is a get request and the api is public
    if (public_status === 'true' && ctx.request.method === 'GET' || api_key === apiKey && api_secret_key === apiSecretKey) await next();
    else {
      ctx.body = { error: 'You do not have the right permissions to access this api.' };
      ctx.status = 403;
    }
  }
};

module.exports = authenticateAccess;