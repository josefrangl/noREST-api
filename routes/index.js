const combineRouters = require('koa-combine-routers');
const Router = require('koa-router');
const defaultRouter = new Router();

const  _404 = 'The requested URL was not found on this server.';

defaultRouter.get('/*', () => {
  this.body = _404;
  this.status = 404;
});

const apiRouter = require('./api/apiRouter');
const logisticsRouter = require('./logistics/logisticsRouter');
const webappRouter = require('./webapp/webappRouter');

const router = combineRouters(
  defaultRouter,
  apiRouter,
  logisticsRouter,
  webappRouter
);



module.exports = router;