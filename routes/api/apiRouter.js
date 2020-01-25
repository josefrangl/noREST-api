const Router = require('koa-router');
const apiRouter = new Router();

const apiController = require('../../controllers/api/apiController');

// basic (mvp) routes
apiRouter.get('/api/:api_name',);
apiRouter.get('/api/:api_name/:field/:value',);
apiRouter.post('/api/:api_name',);
apiRouter.put('/api/:api_name/:id',);
apiRouter.delete('/api/:api_name/:id',);


module.exports = apiRouter;
  
