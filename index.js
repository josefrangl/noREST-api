'use strict';

const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');

require('./db/mongodb/mongodb');

if (process.env.NODE_ENV !== 'production') require('dotenv').config();



app.use(bodyParser());
app.use(cors());
app.use(router.routes());

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`🤖: Server listening on port ${PORT}`);

