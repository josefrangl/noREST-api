const mongoose = require('../../db/mongodb/mongodb.js');

const userModel = mongoose.model('users', {
  email: {
    type: String,
    allowNull: false,
  },
  password: {
    type: String,
    allowNull: false,
  }
})

module.exports = userModel;