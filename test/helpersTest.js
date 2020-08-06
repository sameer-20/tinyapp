// Testing Helper functions

const { assert } = require('chai');

const { getUserByEmail, urlsForUser, hashedPassword, generateRandomString } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


const testUrlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  a7JLxP: { longURL: "https://www.lighthouselabs.ca", userID: "aM31lW" },
  i3AoUt: { longURL: "https://www.google.com", userID: "aJ48lW" }
};


describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = testUsers.userRandomID;
    assert.deepEqual(user,expectedOutput);
  });

  it('should return false if the email does not exist in the database', function() {
    const user = getUserByEmail("userxx@example.com", testUsers);
    const expectedOutput = false;
    assert.equal(user, expectedOutput);
  });
});


describe('generateRandomString', function() {
  it('should return a string of 6 characters', function() {
    const strLength = generateRandomString().length;
    const expectedOutput = 6;
    assert.deepEqual(strLength,expectedOutput);
  });
});


describe('urlsForUser', function() {
  it('should return an object containing urls filtered based on the userID', function() {
    const obj = urlsForUser("aJ48lW", testUrlDatabase);
    const expectedOutput = {
      b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
      i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
      i3AoUt: { longURL: "https://www.google.com", userID: "aJ48lW" }
    };
    assert.deepEqual(obj,expectedOutput);
  });

  it('should return an empty object if no urls exist for the given userID', function() {
    const obj = urlsForUser("bJ74lW", testUrlDatabase);
    const expectedOutput = {};
    assert.deepEqual(obj,expectedOutput);
  });
});


describe('hashedPassword', function() {
  it('should not return the same entered plain-text password', function() {
    const hashPwd = hashedPassword("Apple@123");
    const expectedOutput = "Apple@123";
    assert.notStrictEqual(hashPwd,expectedOutput);
  });
});