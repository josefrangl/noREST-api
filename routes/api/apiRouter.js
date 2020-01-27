const Router = require('koa-router');
const apiRouter = new Router();
const authMiddleware = require('../../utils/apiAuthentication');

const apiController = require('../../controllers/api/apiController');

// basic (mvp) routes
apiRouter.get('/api/:api_name', authMiddleware, apiController.getAll);
apiRouter.get('/api/:api_name/:field/:value', authMiddleware, apiController.getByFieldAndValue);
apiRouter.post('/api/:api_name', authMiddleware, apiController.postData);
apiRouter.put('/api/:api_name/:id', authMiddleware, apiController.updateRecord);
apiRouter.delete('/api/:api_name/:id', authMiddleware, apiController.deleteRecord);


module.exports = apiRouter;

// create middleware folder and file then put as an argument in the function the controller;

// check using redis if the api is public or private;
//   if (public) {
//     if (method === get) {
//       can pass;
//     } else {
//       can NOT pass;
//     }
//   } else if (private) {
//     if (authorization headers are correct) {
//       can pass;
//     } else {
//       can NOT pass;
//     }
//   }

