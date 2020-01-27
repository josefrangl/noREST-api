const userModel = require('../../models/webapp/webappModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');

const redisPrefix = 'user-';

const signup = async (ctx) => {
  const { email, password } = ctx.request.body;
  const saltRounds = 10; // move this to the env file 
  const hash = await bcrypt.hash(password, saltRounds);

  try {
    const user = await redis.get(redisPrefix + email);
    if (user) ctx.body = 'This email is already registered.'
    else {
      const redisUser = await redis.set(redisPrefix + email, hash);
      const newUser = await userModel.create({
        email: email,
        password: hash
      });
      // make a jwt token out of their details
      ctx.status = 201;
      ctx.body = newUser; // should be jwt token
    }
  } catch (error) {
    console.log('Error creating user: ', error);
    ctx.body = 'Error creating user in database.';
    ctx.status = 503;
  }
}

const login = async (ctx) => {
  const { email, password } = ctx.request.body;
  try {
    const user = await redis.exists(redisPrefix + email);
    if (!user) ctx.body = 'This email has not been registered';
    else {
      const hash = await redis.get(redisPrefix + email);
      const valid = await bcrypt.compare(password, hash);
      if (!valid) ctx.body = 'Incorrect password.'
      else {
        // jwt their details
        ctx.body = 'login'; // should be the jwt token
      }
    }
  } catch (error) {
    console.log('Error logging in user: ', error);
    ctx.body = 'Error logging user in database.';
    ctx.status = 503;
  }
}

module.exports = {
  signup,
  login
}