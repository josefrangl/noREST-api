'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/norest';

const connectionOptions = { 
  useNewUrlParser: true, 
  useUnifiedTopology: true, 
  useFindAndModify: false 
};

mongoose.connect(url, connectionOptions);

mongoose.connection.once('open', () => {
  // eslint-disable-next-line no-console
  console.log(`🦌 Connected to mongo at ${url}`);
});

module.exports = mongoose;
