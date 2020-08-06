// Helper Functions

// To hash the passwords
const bcrypt = require('bcrypt'); 
const SALT_ROUNDS = 10;

// To check if user's email id exists in users DB
const getUserByEmail = (emailID, database) => {
  for (let user in database) {
    if (database[user].email === emailID) {
      return database[user];
    }
  }
  return false;
};


// Returns the URLs if the userID is equal to the id of the currently logged-in user
const urlsForUser = (id, database) => {
  const urlObj = {};
  for (let key in database) {
    if (database[key].userID === id) {
      urlObj[key] = database[key];
    }
  }
  return urlObj;
};

// Returns hashed password
const hashedPassword = (password) => {
  const modifiedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
  return modifiedPassword;
};

// Creates a random alphanumeric string with 6 characters
const generateRandomString = () => {
  const randomStr = Math.random().toString(36).slice(2,8);
  return randomStr;
};


module.exports = { getUserByEmail, urlsForUser, hashedPassword, generateRandomString };