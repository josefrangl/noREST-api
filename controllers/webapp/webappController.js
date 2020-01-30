const userModel = require('../../models/webapp/webappModel');
const createToken = require('../../utils/createToken');
const bcrypt = require('bcrypt');
const redis = require('../../db/redis/redis');

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
    const hashPassword = await redis.exists(redisPrefix + email);
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
          hashNewPassword = await bcrypt.hash(password, saltRounds);

          // update redis password
          await redis.set(redisPrefix + email, hashNewPassword);
        }
      }
      const password = hashNewPassword || hashOldPassword;
      const data = {
        password: hashNewPassword || hashOldPassword
      }
      if (name) data.name = name;
      console.log(data)

      // update mongoose
      const result = await userModel.findOneAndUpdate({ email: email }, data, { new: true })
      ctx.body = result;
      ctx.status = 201;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`Error updating details for user: ${email}`, error);
    ctx.body = 'Error updating user details';
    ctx.status = 503;
  }
}

module.exports = {
  signup,
  login,
  editUser,
};