/*STEPS

Using Homebrew:

## Install mongodb-community (latest version) --->   brew install mongodb-community@4.2
## Start the service in brew ---> brew services start mongodb-community

## Optional: Run mongo to check dbs ---> mongo ---> show dbs
*/

const mongoose = require('mongoose'); //collections are created dynamically??
mongoose.Promise = global.Promise;

const url = 'mongodb://localhost:27017/norest';

mongoose.connect(url, { useNewUrlParser: true , useUnifiedTopology: true});
mongoose.connection.once('open', () => console.log(`Connected to mongo at ${url}`));

module.exports = mongoose;