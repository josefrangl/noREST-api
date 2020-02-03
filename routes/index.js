const combineRouters = require('koa-combine-routers');
const Router = require('koa-router');
const catchAllRouter = new Router();

const  _404 = {error: 'The requested URL was not found on the noREST server.' };

catchAllRouter.all('/*', () => {
  this.body = _404;
  this.status = 404;
});

const apiRouter = require('./api/apiRouter');
const logisticsRouter = require('./logistics/logisticsRouter');
const webappRouter = require('./webapp/webappRouter');

const router = combineRouters(
  apiRouter,
  logisticsRouter,
  webappRouter,
  catchAllRouter
);


module.exports = router;