const Router = require('koa-router');
const logisticsRouter = new Router();

const logisticsController = require('../../controllers/logistics/logisticsController');

logisticsRouter.get('/logistics/create-api', logisticsController.createApi);




module.exports = logisticsRouter;