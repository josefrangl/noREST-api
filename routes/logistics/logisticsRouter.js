const Router = require('koa-router');
const logisticsRouter = new Router();

const logisticsController = require('../../controllers/logistics/logisticsController');

// gets all users APIs
logisticsRouter.get('/logistics/admin/api', logisticsController.adminGetAllApi); // admin only

// gets all APIs owned by a given user
logisticsRouter.get('/logistics/api/user/:user_id', logisticsController.getUserApis);

// CRuD a certain API.
logisticsRouter.post('/logistics/api/verify', logisticsController.verifyApiName);
logisticsRouter.get('/logistics/api/:api_name', logisticsController.getApi);
logisticsRouter.post('/logistics/api', logisticsController.createApi);
logisticsRouter.put('/logistics/api/:api_name', logisticsController.updateApi);
logisticsRouter.del('/logistics/api/:api_name', logisticsController.deleteApi);

module.exports = logisticsRouter;