const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');
const uuidv1 = require('uuid/v1');
const sendForgotPasswordMail = require('../../utils/forgotPasswordEmail');
const ApiModel = require('../../models/logistics/logisticsModel');

const redisPrefix = 'user-';

const signup = async (ctx) => {
  const { name, email, password } = ctx.request.body;
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
          name: name,
          email: email,
          password: hashPassword
        });

        // Create JWT token
        const responseUser = {
          id: newUser._id, // correct?
          email: newUser.email,
          name: newUser.name
        };

        const token = createToken(responseUser);
        ctx.status = 201;
        ctx.body = { token };

      } else {
        ctx.body = 'Could not set user in Redis';
        ctx.status = 503;
      }

    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error creating user: ', error);
    ctx.body = 'Error creating user in database.';
    ctx.status = 503;
  }
};

const login = async (ctx) => {
  const { email, password } = ctx.request.body;
  try {
    const hashPassword = await redis.get(redisPrefix + email);
    if (!hashPassword) {
      ctx.body = 'This email has not been registered';
      ctx.status = 202;
    } else {
      const valid = await bcrypt.compare(password, hashPassword);
      if (!valid) ctx.body = 'Incorrect password.';
      else {
        // Create JWT token
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
    ctx.body = 'Error logging user in database.';
    ctx.status = 503;
  }
};

const editUser = async (ctx) => {
  const email = ctx.params.email;
  const { name, oldPassword, newPassword } = ctx.request.body;
  const hashOldPassword = await redis.get(redisPrefix + email);
  let hashNewPassword;
  try {
    // check the user exists
    if (!hashOldPassword) {
      ctx.body = 'This email has not been registered';
      ctx.status = 202;
    } else {
      // compare passwords
      if (newPassword) {
        const valid = await bcrypt.compare(oldPassword, hashOldPassword);
        if (!valid) ctx.body = 'Make sure you entered your old password correctly.';
        else {
          const saltRounds = 10; // move this to the env file
          hashNewPassword = await bcrypt.hash(newPassword, saltRounds);

          // update redis password
          await redis.set(redisPrefix + email, hashNewPassword);
        }
      }
      const data = {
        password: hashNewPassword || hashOldPassword
      };
      if (name) data.name = name;

      // update mongoose
      const result = await userModel.findOneAndUpdate({ email: email }, data, { new: true });
      ctx.body = result;
      ctx.status = 201;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error updating details for user: ${email}.`, error);
    ctx.body = 'Error updating user details.';
    ctx.status = 503;
  }
};

const forgotPassword = async (ctx) => {
  const email = ctx.params.email;
  const newPassword = uuidv1();
  const saltRounds = 10; // move this to the env file
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
    ctx.body = 'Error resetting password';
    ctx.status = 503;
  }
};

const deleteUser = async (ctx) => {
  const id = ctx.params.user_id;

  try {
    const { email } = await userModel.findOne({ _id: id });
    const userApis = await ApiModel.find({ user: id });

    // delete from mongoose
    const deleted = await ApiModel.deleteMany({ user: id });
    if (deleted) {

      // delete from redis
      // has to be map as promise all expects an array of promise and map returns an array whereas forEach will only iterate
      await Promise.all(userApis.map(async (api) => {
        await redis.delete('api-' + api.api_name);
      }));
      await ApiModel.deleteOne({ _id: id });
      await redis.delete(redisPrefix + email);

      ctx.body = deleted;
      ctx.status = 201;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error deleting user: ${id}.`, error);
    ctx.body = 'Error deleting user.';
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