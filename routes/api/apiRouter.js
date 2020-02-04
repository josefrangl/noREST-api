const Router = require('koa-router');
const apiRouter = new Router();
const authMiddleware = require('../../utils/apiAuthentication');

const multer = require('@koa/multer');
const upload = multer( { dest: 'uploads/'});

const apiController = require('../../controllers/api/apiController');

// get api data
apiRouter.get('/api/:api_name', apiController.getAll);
apiRouter.get('/api/:api_name/:field/:value', apiController.getByFieldAndValue);

// post api data, files are allowed
apiRouter.post('/api/:api_name', apiController.postData);
apiRouter.post('/api/file/:api_name', upload.any(), apiController.uploadFile);

// edit and delete api data
apiRouter.put('/api/:api_name/:id', apiController.updateRecord);
apiRouter.delete('/api/:api_name/:id', apiController.deleteRecord);


module.exports = apiRouter;