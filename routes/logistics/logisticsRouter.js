const Router = require('koa-router');
const logisticsRouter = new Router();

const logisticsController = require('../../controllers/logistics/logisticsController');

// verify an API name
logisticsRouter.post('/logistics/api/verify', logisticsController.verifyApiName);

// generate new API keys
logisticsRouter.get('/logistics/api/:api_name/keys', logisticsController.generateNewApiKeys);

// gets all API details for all users and all public APIs
logisticsRouter.get('/logistics/admin/api', logisticsController.adminGetAllApi); // admin only
logisticsRouter.get('/logistics/public', logisticsController.getPublicApis); // admin only

// gets all API details for all the APIs owned by a given user
logisticsRouter.get('/logistics/api/user/:user_id', logisticsController.getUserApis);

// gets the details for one API from our database
logisticsRouter.get('/logistics/api/:api_name', logisticsController.getApi);

// create, update, delete and delete the details for an API
logisticsRouter.post('/logistics/api', logisticsController.createApi);
logisticsRouter.put('/logistics/api/:api_name', logisticsController.updateApi);
logisticsRouter.del('/logistics/api/:api_name', logisticsController.deleteApi);
logisticsRouter.del('/logistics/data/api/:api_name', logisticsController.deleteApiData);

module.exports = logisticsRouter;