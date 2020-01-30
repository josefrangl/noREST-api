const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;

function createToken (currentUser) {
  // sign with default (HMAC SHA256)
  
  // EXTRA FEATURE
  // 30 seconds from now
  // let expirationDate =  Math.floor(Date.now() / 1000) + 30; 

  const token = jwt.sign(currentUser, secret);
  return token;
}

module.exports = createToken;

