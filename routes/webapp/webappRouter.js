const Router = require('koa-router');
const webappRouter = new Router();

const webappController = require('../../controllers/webapp/webappController');

webappRouter.get('/webapp/...', webappController /*.method */);



module.exports = webappRouter;