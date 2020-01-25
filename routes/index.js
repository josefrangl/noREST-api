const combineRouters = require('koa-combine-routers');

const apiRouter = require('./api/apiRouter');
const logisticsRouter = require('./logistics/logisticsRouter');
const webappRouter = require('./webapp/webappRouter');

const router = combineRouters(
  apiRouter,
  logisticsRouter,
  webappRouter
);

const  _404 = 'The requested URL was not found on this server.';

router.get('/*', () => {
  this.body = _404;
  this.status = 404;
});

module.exports = router;