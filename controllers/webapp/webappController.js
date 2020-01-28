const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');

const redisPrefix = 'user-';

const signup = async (ctx) => {
  const { email, password } = ctx.request.body;
  const saltRounds = 10; // move this to the env file
  const hashPassword = await bcrypt.hash(password, saltRounds);

  try {
    const user = await redis.get(redisPrefix + email);
    if (user) {
      ctx.body = 'This email is already registered.'; // be less sepcific
      ctx.status = 202;
    } else {
      const redisUser = await redis.set(redisPrefix + email, hashPassword);
      if (redisUser) {
        const newUser = await userModel.create({
          email: email,
          password: hashPassword
        });

        // make a jwt token out of their details
        const responseUser = {
          email: newUser.email
        }

        const token = createToken(responseUser);
        ctx.status = 201;
        ctx.body = {token}; // Test handlebars

      } else {
        ctx.body = 'Could not set user in Redis';
        ctx.status = 503;
      }

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
    if (!user) {
      ctx.body = 'This email has not been registered';
      ctx.status = 202;
    } else {
      const hashPassword = await redis.get(redisPrefix + email);
      const valid = await bcrypt.compare(password, hashPassword);
      if (!valid) ctx.body = 'Incorrect password.'
      else {
        // jwt their details
        const responseUser = {
          email
        }
        const token = createToken(responseUser);
        ctx.body = {token}; // Test handlebars
        ctx.status = 200;
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