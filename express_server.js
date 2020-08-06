// Tiny App

const express = require('express');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt'); // To hash the passwords
const cookieSession = require('cookie-session'); // Simple cookie-based session middleware
const { getUserByEmail, urlsForUser, hashedPassword, generateRandomString } = require('./helpers');

const PORT = 8080;

// creating an Express app
const app =  express();

// To parse request body from Buffer to string
app.use(bodyParser.urlencoded({extended: true}));

// Setting ejs as the template engine
app.set("view engine", "ejs");

// Using cookie session with two keys
app.use(cookieSession({
  name: 'session',
  keys: ['4146fa26-72b8-4caf-be85-d465e73af448', 'd6b96b47-3582-4d9d-83fa-560daab4c45a']
}));

// In memory database for URLs
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// In memory database for Users
const users = {
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


// Sample Code to check if the application is working

app.get("/", (req,res) => {
  res.send(`Hello!`);
});

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// CRUD operations

// List all the urls
// READ
// GET /urls

app.get("/urls", (req,res) => {
  const idVal = req.session.user_id;
  // Users Can Only See Their Own Shortened URLs
  if (!users[idVal]) {
    console.log(`Please log in or register to view the URLs.`);
    res.redirect('/login');
  } else {
    const filteredURL = urlsForUser(idVal, urlDatabase);
    const templateVars = {urls : filteredURL, user: users[idVal]};
    console.log(templateVars);
    res.render("urls_index", templateVars);
  }
});

// Display the urls_new form
// READ
// GET /urls/new
app.get("/urls/new", (req, res) => {
  // get the current user
  // read the user id value from the cookies
  const idVal = req.session.user_id;
  // Only Registered Users Can Shorten URLs
  if (!users[idVal]) {
    res.redirect('/login');
  } else {
    const templateVars = {user: users[idVal]};
    res.render('urls_new', templateVars);
  }
});

// Add a new url
// CREATE
// POST /urls

app.post("/urls", (req, res) => {
  // extract the url content from the form
  // content of the form is contained in an object call req.body
  // req.body is given by the bodyParser middleware
  const randomVal = generateRandomString();
  //URLs Belong to Users
  urlDatabase[randomVal] = {longURL: req.body["longURL"], userID: req.session.user_id};
  console.log(urlDatabase);
  res.redirect(`/urls/${randomVal}`);
});


// Edit a url
// Display the form
// GET /urls/:shortURL

app.get("/urls/:shortURL", (req,res) => {
  const idVal = req.session.user_id;
  // Users Can Only See Their Own Shortened URLs
  if (!users[idVal]) {
    console.log(`Please log in or register to view the URLs.`);
    res.redirect('/login');
  } else {
    const templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[idVal]};
    // render the show page
    res.render("urls_show", templateVars);
  }
});

// Open the link represented by the longURL
app.get("/u/:shortURL", (req, res) => {
  const dbLongURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(dbLongURL);
});

// DELETE
app.post('/urls/:shortURL/delete', (req,res) => {
  const idVal = req.session.user_id;
  // Users Can Only delete their own URLs after login
  if (users[idVal]) {
    // Delete the url on click of delete button
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    console.log(`Cannot delete URL as user is not logged in.`);
    res.send(`Cannot delete URL as user is not logged in.`);
  }
});

// Update the url in the urlDatabase
app.post('/urls/:shortURL', (req,res) => {
  // Updates the longURL on click of Submit button
  urlDatabase[req.params.shortURL].longURL = req.body["longURL"];
  res.redirect("/urls");
});

// Authenticate the user
app.post('/login', (req,res) => {
  const foundUser = getUserByEmail(req.body.email, users);
  if (req.body.email === "" || req.body.password === "") {
    console.log("Email ID and/or Password is blank");
    res.send(`Error: Status Code: 400. Email ID and/or Password cannot be blank.`);
  } else if (!foundUser) {
    console.log("Email ID does not exist!");
    res.send(`Error: Status Code: 403. Email ID does not exist.`);
  } else if (foundUser) {
    const result = bcrypt.compareSync(req.body.password, foundUser.password);
    if (result) {
      req.session.user_id = foundUser.id;
      res.redirect('/urls');
    } else {
      console.log("Incorrect password!");
      res.send(`Error: Status Code: 403. Incorrect password.`);
    }
  }
});

// On User logout, clear the session
app.post('/logout', (req,res) => {
  req.session.user_id = null;
  res.redirect('/login');
});

// Display the register form
app.get('/register', (req,res) => {
  const idVal = req.session.user_id;
  const templateVars = {user: users[idVal]};
  res.render("user_register", templateVars);
});

// Get the info from the register form
app.post('/register', (req,res) => {
  if (req.body.email === "" || req.body.password === "") {
    console.log("Email ID and/or Password is blank");
    res.send(`Error: Status Code: 400. Email ID and/or Password cannot be blank.`);
  } else if (getUserByEmail(req.body.email, users)) {
    console.log("Email ID already exists!");
    res.send(`Error: Status Code: 400. Email ID already exists.`);
  } else {
    const randomId = generateRandomString();
    const hashedPwd = hashedPassword(req.body.password);
    users[randomId] = {id: randomId, email: req.body.email , password: hashedPwd};
    console.log(users);
    req.session.user_id = randomId;
    res.redirect('/urls');
  }
});

// Display the login form
app.get('/login', (req,res) => {
  const idVal = req.session.user_id;
  const templateVars = {user: users[idVal]};
  res.render("user_login", templateVars);
});

// App listens to the mentioned PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

