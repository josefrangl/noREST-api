const Router = require('koa-router');
const apiRouter = new Router();
const authMiddleware = require('../../utils/apiAuthentication');

const apiController = require('../../controllers/api/apiController');

// basic (mvp) routes
apiRouter.get('/api/:api_name', authMiddleware, apiController.getAll);
apiRouter.get('/api/:api_name/:field/:value', authMiddleware, apiController.getByFieldAndValue);
apiRouter.post('/api/:api_name', apiController.postData);
apiRouter.put('/api/:api_name/:id', authMiddleware, apiController.updateRecord);
apiRouter.delete('/api/:api_name/:id', authMiddleware, apiController.deleteRecord);


module.exports = apiRouter;