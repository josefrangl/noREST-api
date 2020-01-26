const Router = require('koa-router');
const logisticsRouter = new Router();

const logisticsController = require('../../controllers/logistics/logisticsController');

// logisticsRouter.del('/logistics/api/:api_name', logisticsController.deleteAPi);

logisticsRouter.get('/logistics/admin/api', logisticsController.adminGetAllApi); // admin only

logisticsRouter.get('/logistics/api/user/:user_id', logisticsController.getUserApis);

logisticsRouter.get('/logistics/api/:api_name', logisticsController.getApi);
logisticsRouter.post('/logistics/api', logisticsController.createApi);
// logisticsRouter.put() maybe for updating the name or the keys? -jf
logisticsRouter.del('/logistics/api/:api_name', logisticsController.deleteApi);

module.exports = logisticsRouter;