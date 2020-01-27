const Router = require('koa-router');
const webappRouter = new Router();

const webappController = require('../../controllers/webapp/webappController');

webappRouter.get('/webapp/signup', webappController.signup);
webappRouter.get('/webapp/login', webappController.login);



module.exports = webappRouter;