'use strict';
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const Koa = require('koa');
const app = new Koa();

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const options = {
  origin: '*',
};

const jwtVerify = require('koa-jwt');

const router = require('./routes/index');
require('./db/mongodb/mongodb');
require('./db/redis/redis');

app.use(cors(options));
app.use(
  jwtVerify({ secret: process.env.JWT_SECRET })
    .unless({
      path: [/^\/webapp\/login/, /^\/webapp\/signup/, /^\/api\/[a-zA-Z0-9\d]+/, /^\/logistics\/api\/verify/, /^\/logistics\/api\/[a-zA-Z0-9\d]+\/keys/,  /^\/logistics\/public/ ]
    })
);
app.use(bodyParser());
app.use(router());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🤖: Server listening on port ${PORT}`);
});

