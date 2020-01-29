const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');

const redisPrefix = 'user-';

const signup = async (ctx) => {
  const { name , email, password } = ctx.request.body;
  const saltRounds = 10; // move this to the env file
  const hashPassword = await bcrypt.hash(password, saltRounds);

  console.log(name, email, password);

  try {
    const user = await redis.get(redisPrefix + email);
    if (user) {
      ctx.body = 'This email is already registered.'; // be less sepcific
      ctx.status = 202;
    } else {
      const redisUser = await redis.set(redisPrefix + email, hashPassword);
      if (redisUser) {
        const newUser = await userModel.create({
          name: name,
          email: email,
          password: hashPassword
        });

        // Create JWT token
        const responseUser = {
          id: newUser._id, // correct?
          email: newUser.email,
          name: newUser.name
        }
        const token = createToken(responseUser);
        ctx.status = 201;
        ctx.body = {token};

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
        // Create JWT token
        const mongoUser = await userModel.find({email: email});
        console.log('MONGO USER   ', mongoUser);
        const responseUser = {
          email,
          name: mongoUser[0].name,
          id: mongoUser[0]._id
        }
        const token = createToken(responseUser);
        ctx.body = {token};
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