const mongoose = require('../../db/mongodb/mongodb.js');

const ApiModel = mongoose.model('apis', {
  api_name: {
    type: String,
    allowNull: false,
  },
  description: {
    type: String,
    allowNull: true,      
  },
  public: {
    type: Boolean,
    allowNull: false,
    default: false
  },
  user: {
    type: String, // maybe int? check up
    allowNull: false,
  },
  api_key: {
    type: String,
    allowNull: false,
  },
  api_secret_key: {
    type: String,
    allownull: false
  },
  date_created: {
    type: Date,
    allownull: false,
    default: Date.now() // or new Date.now? -jf
  },
  date_last_updated: {
    type: Date,
    allownull: false,
    default: Date.now() // or new Date.now? -jf
  }
});

module.exports = ApiModel;