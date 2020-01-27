/*STEPS

Using Homebrew:

## Install mongodb-community (latest version) --->   brew install mongodb-community@4.2
## Start the service in brew ---> brew services start mongodb-community


## Run mongo on terminal to check dbs ---> mongo
## In mongo: To check your dbs ---> >show dbs
## Create db locally if not existing already ---> >use norest

## Ready to go!

*/

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const base_url = process.env.MONGODB_URL || 'mongodb://localhost:27017/';
const dbName = process.env.MONGODB_NAME || 'norest';

const url = `${base_url}${dbName}`;

mongoose.connect(url, { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.connection.once('open', () => console.log(`Connected to mongo at ${url}`));

module.exports = mongoose;
