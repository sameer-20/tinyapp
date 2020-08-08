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


// CRUD operations

app.get("/", (req,res) => {
  // get the current user
  // read the user id value from the cookies and redirect accordingly if logged in or not
  const currentUser = req.session.user_id;
  if (!users[currentUser]) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

// List all the urls
// READ
// GET /urls

app.get("/urls", (req,res) => {
  const currentUser = req.session.user_id;
  // Users Can Only See Their Own Shortened URLs
  if (!users[currentUser]) {
    const templateVars = {error: false, statusCode: "", message: ""};
    res.render("urls_error", templateVars);
  } else {
    const filteredURL = urlsForUser(currentUser, urlDatabase);
    const templateVars = {urls : filteredURL, user: users[currentUser]};
    res.render("urls_index", templateVars);
  }
});

// Display the urls_new form
// READ
// GET /urls/new
app.get("/urls/new", (req, res) => {
  // get the current user
  // read the user id value from the cookies
  const currentUser = req.session.user_id;
  // Only Registered Users Can Shorten URLs
  if (!users[currentUser]) {
    res.redirect('/login');
  } else {
    const templateVars = {user: users[currentUser]};
    res.render('urls_new', templateVars);
  }
});

// Add a new url
// CREATE
// POST /urls

app.post("/urls", (req, res) => {
  const currentUser = req.session.user_id;
  if (users[currentUser]) {
    // extract the url content from the form
    // content of the form is contained in an object call req.body
    // req.body is given by the bodyParser middleware
    const randomVal = generateRandomString();
    //URLs Belong to Users
    urlDatabase[randomVal] = {longURL: req.body["longURL"], userID: req.session.user_id};
    res.redirect(`/urls/${randomVal}`);
  } else {
    const templateVars = {error: false, statusCode: "", message: ""};
    res.render("urls_error", templateVars);
  }
});


// Edit a url
// Display the form
// GET /urls/:id

app.get("/urls/:id", (req,res) => {
  const currentUser = req.session.user_id;
  const urlId = req.params.id;
  // Throw error if user is not logged in
  if (!users[currentUser]) {
    const templateVars = {error: false, statusCode: "", message: ""};
    res.render("urls_error", templateVars);
  } else {
    // Throw error if requested URL does not exist
    if (!urlDatabase[urlId]) {
      const templateVars = {error: true, statusCode: 404, message: "Requested resource not found"};
      res.render("urls_error", templateVars);
    } else if (urlDatabase[urlId].userID !== currentUser) {
      // Throw error if requested URL does not belong to the user
      const templateVars = {error: true, statusCode: 403, message: "Access Denied"};
      res.render("urls_error", templateVars);
    } else {
      const templateVars = {id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[currentUser]};
      res.render("urls_show", templateVars);
    }
  }
});

// Open the link represented by the longURL
app.get("/u/:id", (req, res) => {
  const dbLongURL = urlDatabase[req.params.id].longURL;
  if (dbLongURL === "") {
    const templateVars = {error: true, statusCode: 404, message: "Requested resource does not exist"};
    res.render("urls_error", templateVars);
  } else {
    res.redirect(dbLongURL);
  }
});

// DELETE
app.post('/urls/:id/delete', (req,res) => {
  const currentUser = req.session.user_id;
  const urlId = req.params.id;
  // Throw error if user is not logged in
  if (!users[currentUser]) {
    const templateVars = {error: false, statusCode: "", message: ""};
    res.render("urls_error", templateVars);
  } else {
    // Throw error if requested URL does not exist
    if (!urlDatabase[urlId]) {
      const templateVars = {error: true, statusCode: 404, message: "Requested resource not found"};
      res.render("urls_error", templateVars);
    } else if (urlDatabase[urlId].userID !== currentUser) {
      // Throw error if requested URL does not belong to the user
      const templateVars = {error: true, statusCode: 403, message: "Access Denied"};
      res.render("urls_error", templateVars);
    } else {
      delete urlDatabase[req.params.id]; // Delete the url on click of delete button
      res.redirect("/urls");
    }
  }
});

// Update the url in the urlDatabase
app.post('/urls/:id', (req,res) => {
  const currentUser = req.session.user_id;
  const urlId = req.params.id;
  // Throw error if user is not logged in
  if (!users[currentUser]) {
    const templateVars = {error: false, statusCode: "", message: ""};
    res.render("urls_error", templateVars);
  } else {
    // Throw error if requested URL does not belong to the user
    if (urlDatabase[urlId].userID !== currentUser) {
      const templateVars = {error: true, statusCode: 403, message: "Access Denied"};
      res.render("urls_error", templateVars);
    } else {
      // Update the longURL on click of Submit button
      urlDatabase[req.params.id].longURL = req.body["longURL"];
      res.redirect("/urls");
    }
  }
});

// Authenticate the user
app.post('/login', (req,res) => {
  const foundUser = getUserByEmail(req.body.email, users);
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {error: true, statusCode: 400, message: "Email ID and/or Password cannot be blank"};
    res.render("urls_error", templateVars);
  } else if (!foundUser) {
    const templateVars = {error: true, statusCode: 403, message: "Email ID does not exist"};
    res.render("urls_error", templateVars);
  } else if (foundUser) {
    const result = bcrypt.compareSync(req.body.password, foundUser.password);
    if (result) {
      req.session.user_id = foundUser.id;
      res.redirect('/urls');
    } else {
      const templateVars = {error: true, statusCode: 403, message: "Incorrect password"};
      res.render("urls_error", templateVars);
    }
  }
});

// On User logout, clear the session
app.post('/logout', (req,res) => {
  req.session = null;
  res.redirect('/urls');
});

// Display the register form if not logged in else redirect to '/urls' if logged in
app.get('/register', (req,res) => {
  const currentUser = req.session.user_id;
  if (!users[currentUser]) {
    const templateVars = {user: users[currentUser]};
    res.render("user_register", templateVars);
  } else {
    res.redirect('/urls');
  }
});

// Get the info from the register form
app.post('/register', (req,res) => {
  if (req.body.email === "" || req.body.password === "") {
    const templateVars = {error: true, statusCode: 400, message: "Email ID and/or Password cannot be blank"};
    res.render("urls_error", templateVars);
  } else if (getUserByEmail(req.body.email, users)) {
    const templateVars = {error: true, statusCode: 400, message: "Email ID already exists"};
    res.render("urls_error", templateVars);
  } else {
    const randomId = generateRandomString();
    const hashedPwd = hashedPassword(req.body.password);
    users[randomId] = {id: randomId, email: req.body.email , password: hashedPwd};
    req.session.user_id = randomId;
    res.redirect('/urls');
  }
});

// Display the login form if not logged in else redirect to '/urls' if logged in
app.get('/login', (req,res) => {
  const currentUser = req.session.user_id;
  if (!users[currentUser]) {
    const templateVars = {user: users[currentUser]};
    res.render("user_login", templateVars);
  } else {
    res.redirect('/urls');
  }
});

// App listens to the mentioned PORT
app.listen(PORT, () => {});

