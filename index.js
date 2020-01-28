"use strict";
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const Koa = require("koa");
const app = new Koa();

const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");

const jwtVerify = require("koa-jwt");
var options = {
  origin: "http://localhost:3001", // Info in .env, port may change
};
app.use(cors(options));
const router = require("./routes/index");

require("./db/mongodb/mongodb");
require("./db/redis/redis");

app.use(
  jwtVerify({ secret: process.env.JWT_SECRET }).unless({
    path: [/^\/webapp\/login/, /^\/webapp\/signup/, /^\/api\/[a-zA-Z\d]+/]
  })
); // Test regex for APIs

app.use(bodyParser());

app.use(router());

const PORT = process.env.PORT || 3000;

app.listen(PORT);

console.log(`🤖: Server listening on port ${PORT}`);
