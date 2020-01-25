const Router = require('koa-router');
const logisticsRouter = new Router();

const logisticsController = require('../../controllers/logistics/logisticsController');

logisticsRouter.get('/logistics/...', logisticsController /*.method */);



module.exports = logisticsRouter;