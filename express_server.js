// Tiny App

const express = require('express');

const app =  express();
const PORT = 8080;

const bodyParser = require("body-parser");

// To convert request body from Buffer to string
app.use(bodyParser.urlencoded({extended: true}));

// Use ejs as template engine
app.set("view engine", "ejs");

const cookieParser = require('cookie-parser');
const { request } = require('express');
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

// To check if email id exists in users DB
const emailCheck = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};

app.get("/", (req,res) => {
  res.send(`Hello!`);
});

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req,res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req,res) => {
  let idVal = req.cookies["user_id"];
  let templateVars = {urls : urlDatabase, user: users[idVal]};
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let idVal = req.cookies["user_id"];
  // Only Registered Users Can Shorten URLs
  if (!users[idVal]) {
    res.redirect('/login');
  } else {
    let templateVars = {user: users[idVal]};
    res.render('urls_new', templateVars);
  }  
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let randomVal = generateRandomString();
  //URLs Belong to Users
  urlDatabase[randomVal] = {longURL: req.body["longURL"], userID: req.cookies["user_id"]};
  console.log(urlDatabase);
  res.redirect(`/urls/${randomVal}`);
});


app.get("/urls/:shortURL", (req,res) => {
  let idVal = req.cookies["user_id"];
  let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[idVal]};
  res.render("urls_show", templateVars);
});


app.get("/u/:shortURL", (req, res) => {
  const dbLongURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(dbLongURL);
});


app.post('/urls/:shortURL/delete', (req,res) => {
  // Deletes the key-value pair on click of delete button
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


app.post('/urls/:shortURL', (req,res) => {
  // Updates the longURL on click of Submit button
  urlDatabase[req.params.shortURL].longURL = req.body["longURL"];
  res.redirect("/urls");
});


app.post('/login', (req,res) => {
  if (req.body.email === "" || req.body.password === "") {
    console.log("Email ID and/or Password is blank");
    res.send(`Error: Status Code: 400. Email ID and/or Password cannot be blank.`);
  } else if (!emailCheck(req.body.email)) {
    console.log("Email ID does not exist!");
    res.send(`Error: Status Code: 403. Email ID does not exist.`);
  } else if (emailCheck(req.body.email)) {
    let foundUser = emailCheck(req.body.email);
    if (foundUser.password !== req.body.password) {
      console.log("Incorrect password!");
      res.send(`Error: Status Code: 403. Incorrect password.`);
    } else {
      res.cookie('user_id',foundUser.id);
      console.log('Cookies: ', req.cookies);
      res.redirect('/urls');
    }
  }
});


app.post('/logout', (req,res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// User registration page
app.get('/register', (req,res) => {
  let idVal = req.cookies["user_id"];
  let templateVars = {user: users[idVal]};
  res.render("user_register", templateVars);
});

// Set cookie on successful registration
app.post('/register', (req,res) => {
  if (req.body.email === "" || req.body.password === "") {
    console.log("Email ID and/or Password is blank");
    res.send(`Error: Status Code: 400. Email ID and/or Password cannot be blank.`);
  } else if (emailCheck(req.body.email)) {
    console.log("Email ID already exists!");
    res.send(`Error: Status Code: 400. Email ID already exists.`);
  } else {
    let randomId = generateRandomString();
    users[randomId] = {id: randomId, email: req.body["email"] , password: req.body["password"]};
    console.log(users);
    res.cookie('user_id',randomId);
    res.redirect('/urls');
  }
});


// User login page
app.get('/login', (req,res) => {
  let idVal = req.cookies["user_id"];
  let templateVars = {user: users[idVal]};
  res.render("user_login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});


const generateRandomString = () => {
  let randomStr = Math.random().toString(36).slice(2,8);
  return randomStr;
};


console.log(urlDatabase);