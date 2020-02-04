const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');
const uuidv1 = require('uuid/v1');
const sendForgotPasswordMail = require('../../utils/forgotPasswordEmail');
const ApiModel = require('../../models/logistics/logisticsModel');

const redisPrefix = 'user-';


// --- sign a user up:

const signup = async (ctx) => {
  const { name, email, password } = ctx.request.body;
  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  const hashPassword = await bcrypt.hash(password, saltRounds);

  try {
    // check if the user already exists
    const user = await redis.get(redisPrefix + email);
    if (user) {
      ctx.body = { error: 'This email is already registered.' };
      ctx.status = 202;
    } else {
      const redisUser = await redis.set(redisPrefix + email, hashPassword);
      if (redisUser) {
        const newUser = await userModel.create({
          name: name,
          email: email,
          password: hashPassword
        });

        console.log(newUser);

        // create JWT token
        const responseUser = {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name
        };

        const token = createToken(responseUser);
        ctx.body = { token };
        ctx.status = 200;

      } else {
        ctx.body = { error: 'Could not set user in Redis.' };
        ctx.status = 503;
      }

    }
  } catch (error) {
    console.error('Error creating user: ', error);
    ctx.body = { error: 'Error creating user in database.' };
    ctx.status = 503;
  }
};


// --- login a user:

const login = async (ctx) => {
  const { email, password } = ctx.request.body;
  try {
    const hashPassword = await redis.get(redisPrefix + email);
    if (!hashPassword) {
      ctx.body = { error: 'Email does not exist.' };
      ctx.status = 202;
    } else {
      const valid = await bcrypt.compare(password, hashPassword);
      if (!valid) {
        ctx.body = { error: 'Incorrect password.' };
        ctx.status = 202;
      }
      else {
        // create JWT token
        const mongoUser = await userModel.find({ email: email });
        const responseUser = {
          email,
          name: mongoUser[0].name,
          id: mongoUser[0]._id
        };
        const token = createToken(responseUser);
        ctx.body = { token };
        ctx.status = 200;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error logging in user: ', error);
    ctx.body = { error: 'Error logging user in database.' };
    ctx.status = 503;
  }
};


// --- edit a user ( name or password):

const editUser = async (ctx) => {
  const { email } = ctx.state.user;
  const { name, oldPassword, newPassword } = ctx.request.body;
  const hashOldPassword = await redis.get(redisPrefix + email);
  let hashNewPassword;
  try {
    // check the user exists
    if (!hashOldPassword) {
      ctx.body = { error: 'This account does not exist.' };
      ctx.status = 202;
    } 
    
    // --- Password Change
    if (newPassword) {
      
      // check if old password is valid
      const valid = await bcrypt.compare(oldPassword, hashOldPassword);
      
      if (!valid) {
        ctx.body = { error: 'Make sure you entered your old password correctly.' };
        ctx.status = 202;
      } 

      const saltRounds = parseInt(process.env.SALT_ROUNDS);
      hashNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // update redis password
      await redis.set(redisPrefix + email, hashNewPassword);
    }
    
    const data = { password: hashNewPassword || hashOldPassword };

    // --- Name Change
    if (name) data.name = name;

    // update mongoose with new information
    const result = await userModel.findOneAndUpdate({ email: email }, data, { new: true });
    ctx.body = result;
    ctx.status = 200;

  } catch (error) {
    console.error(`Error updating details for user: ${email}.`, error);
    ctx.body = { error: 'Error updating user details.' };
    ctx.status = 503;
  }
  
};


// --- to delete a user:

const deleteUser = async (ctx) => {
  const { id } = ctx.state.user;

  try {
    const { email } = await userModel.findOne({ _id: id });
    const userApis = await ApiModel.find({ user: id });

    // delete from our mongoose api db
    const deleted = await ApiModel.deleteMany({ user: id });
    if (deleted) {
      
      // delete all their APIs from redis
      // has to be map as promise all expects an array of promise and map returns an array whereas forEach will only iterate
      await Promise.all(userApis.map(async (api) => {
        await redis.delete('api-' + api.api_name);
      }));

      // delete from our mongoose user db
      await userModel.deleteOne({ _id: id });

      // delete their user in redis
      await redis.delete(redisPrefix + email);

      await Promise.all(userApis.map(async (api) => {
        const model = require(`../../models/api/${api.api_name.toLowerCase()}Model.js`);
        await model.collection.drop();
      }));

      ctx.body = deleted;
      ctx.status = 201;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error deleting user: ${id}.`, error);
    ctx.body = { error: 'Error deleting user.' };
    ctx.status = 503;
  }
};


// --- if the user has forgotten their password:

const forgotPassword = async (ctx) => {
  const { email } = ctx.params;
  const newPassword = uuidv1();
  const saltRounds = parseInt(process.env.SALT_ROUNDS);
  const newHashPassword = await bcrypt.hash(newPassword, saltRounds);
  const data = {
    password: newHashPassword
  };

  try {
    await redis.set(redisPrefix + email, newHashPassword);
    const updatedUser = await userModel.findOneAndUpdate({ email: email }, data, { new: true });

    const response = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email
    };

    // send email
    await sendForgotPasswordMail(updatedUser.name, email, newPassword);

    ctx.body = response;
    ctx.status = 201;

  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error resetting password for user: ${email}.`, error);
    ctx.body = { error: 'Error resetting password' };
    ctx.status = 503;
  }
};

module.exports = {
  signup,
  login,
  editUser,
  forgotPassword,
  deleteUser
};