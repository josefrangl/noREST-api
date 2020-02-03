const Router = require('koa-router');
const webappRouter = new Router();

const webappController = require('../../controllers/webapp/webappController');

webappRouter.post('/webapp/signup', webappController.signup);
webappRouter.post('/webapp/login', webappController.login);

// edit/delete a user
webappRouter.put('/webapp/user/edit/:email', webappController.editUser);
webappRouter.delete('/webapp/user/:user_id', webappController.deleteUser);

// if a user has forgotten their password
webappRouter.get('/webapp/user/forgotpassword/:email', webappController.forgotPassword);

// All other routes are protected with jwt middleware in index.js

module.exports = webappRouter;