'use strict';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const Koa = require('koa');
const app = new Koa();

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');

const jwtVerify = require('koa-jwt');

const router = require('./routes/index');

require('./db/mongodb/mongodb');
require('./db/redis/redis');

app.use(jwtVerify({ secret: process.env.JWT_SECRET }).unless({ path: [/^\/webapp\/login/, /^\/webapp\/signup/ ] })); // Test regex

app.use(bodyParser());
app.use(cors({
  origin: '*',
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(router());

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`🤖: Server listening on port ${PORT}`);

