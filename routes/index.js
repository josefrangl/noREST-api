const combineRouters = require('koa-combine-routers');

const apiRouter = require('./api/apiRouter');
const logisticsRouter = require('./logistics/logisticsRouter');
const webappRouter = require('./webapp/webappRouter');

const router = combineRouters(
  apiRouter,
  logisticsRouter,
  webappRouter
);

module.exports = router;