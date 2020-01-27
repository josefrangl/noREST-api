const Router = require('koa-router');
const apiRouter = new Router();

const apiController = require('../../controllers/api/apiController');

// basic (mvp) routes
apiRouter.get('/api/:api_name', apiController.getAll);
apiRouter.get('/api/:api_name/:field/:value', apiController.getByFieldAndValue);
apiRouter.post('/api/:api_name', apiController.postData);
apiRouter.put('/api/:api_name/:id', apiController.updateRecord);
apiRouter.delete('/api/:api_name/:id', apiController.deleteRecord);


module.exports = apiRouter;
  
