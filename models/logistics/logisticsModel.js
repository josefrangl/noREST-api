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
    type: String,
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
  api_fields: {
    type: [{ 
      field_name: {
        type: String,
        allowNull: false,
      },
      field_type: {
        type: String,
        allowNull: false,
      },
      allow_null: {
        type: Boolean,
        allowNull: false,
      },
      default_value: {
        type: String,
        allowNull: false,
      }
    }],
    allowNull: false
  },
  date_created: {
    type: Date,
    allownull: false,
    default: Date.now()
  },
  date_last_updated: {
    type: Date,
    allownull: false,
    default: Date.now()
  }
});

module.exports = ApiModel;