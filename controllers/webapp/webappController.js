const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');
const sendMail = require('../../utils/signupEmail');

const redisPrefix = 'user-';

const signup = async (ctx) => {
  const { name, email, password } = ctx.request.body;
  const saltRounds = 10; // move this to the env file
  const hashPassword = await bcrypt.hash(password, saltRounds);

  try {
    const user = await redis.get(redisPrefix + email);
    if (user) {
      ctx.body = 'This email is already registered.';
      ctx.status = 202;
    } else {

      // send confirmation email
      await sendMail(name, email);

      // save to both dbs
      const redisUser = await redis.set(redisPrefix + email, hashPassword);
      if (redisUser) {
        const newUser = await userModel.create({
          name: name,
          email: email,
          password: hashPassword,
        });

        ctx.status = 201;
        ctx.body = 'Please confirm your email address.';

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

const confirmEmail = async (ctx) => {
  const email = ctx.params.email;
  try {
    // check email exists in db
    const exists = await redis.get(redisPrefix + email);
    if (exists) {

      // create JWT token

      const responseUser = {
        id: user._id, // correct?
        email: user.email,
        name: user.name
      }

      const token = createToken(responseUser);
      ctx.status = 201;
      ctx.body = { token };
      console.log(ctx.body)

      ctx.redirect('http://localhost:3002/confirmed');
      // ctx.status = 201;  
    } else {
      ctx.body = 'This email has not been registered.';
      ctx.status = 503;
    }
  } catch (error) {
    console.log('Error confirming email: ', error);
    ctx.body = 'Error confirming user in database.';
    ctx.status = 503;
  }

  // find email and change active to true
}

const login = async (ctx) => {
  const { email, password } = ctx.request.body;
  try {
    // check this user has previosuly signed up
    const user = await redis.exists(redisPrefix + email);
    if (!user) {
      ctx.body = 'This email has not been registered';
      ctx.status = 202;
    } else {

      // compare passwords
      const hashPassword = await redis.get(redisPrefix + email);
      const valid = await bcrypt.compare(password, hashPassword);
      if (!valid) ctx.body = 'Incorrect password.'
      else {
        // create JWT token
        const mongoUser = await userModel.find({ email: email });
        console.log('MONGO USER   ', mongoUser);
        const responseUser = {
          email,
          name: mongoUser[0].name,
          id: mongoUser[0]._id
        }
        const token = createToken(responseUser);
        ctx.body = { token };
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
  login,
  confirmEmail
}