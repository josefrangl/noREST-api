// MERGE ALL ROUTES

const Router = require('koa-router');
const apiRouter = new Router();

const controller = require('../../controllers/api/api_controller');

apiRouter.get('/api/:api_name/', controller.get);



module.exports = apiRouter.routes();
  
