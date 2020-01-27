const Router = require('koa-router');
const webappRouter = new Router();

const webappController = require('../../controllers/webapp/webappController');

webappRouter.post('/webapp/signup', webappController.signup);
webappRouter.post('/webapp/login', webappController.login);

// All other routes are protected with jwt middleware in index.js



module.exports = webappRouter;