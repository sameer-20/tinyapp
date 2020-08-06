// Tiny App

const express = require('express');

const app =  express();
const PORT = 8080;

const bodyParser = require("body-parser");

// To hash the passwords
const bcrypt = require('bcrypt');

// To convert request body from Buffer to string
app.use(bodyParser.urlencoded({extended: true}));

// Use ejs as template engine
app.set("view engine", "ejs");

const cookieParser = require('cookie-parser');
const { request } = require('express');
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

// Returns the URLs where the userID is equal to the id of the currently logged-in user
const urlsForUser = (id) => {
  const urlObj = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urlObj[key] = urlDatabase[key];
    }
  }
  return urlObj;
};


// Returns hashed password
const hashedPassword = (password) => {
  const modifiedPassword = bcrypt.hashSync(password, 10);
  return modifiedPassword;
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
  // Users Can Only See Their Own Shortened URLs
  if (!users[idVal]) {
    console.log(`Please log in or register to view the URLs.`);
    res.redirect('/login');
  } else {
    let filteredURL = urlsForUser(idVal);
    let templateVars = {urls : filteredURL, user: users[idVal]};
    console.log(templateVars);
    res.render("urls_index", templateVars);
  }
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
  // Users Can Only See Their Own Shortened URLs
  if (!users[idVal]) {
    console.log(`Please log in or register to view the URLs.`);
    res.redirect('/login');
  } else {
    let templateVars = {shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: users[idVal]};
    res.render("urls_show", templateVars);
  }
});


app.get("/u/:shortURL", (req, res) => {
  const dbLongURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(dbLongURL);
});


app.post('/urls/:shortURL/delete', (req,res) => {
  let idVal = req.cookies["user_id"];
  // Users Can Only delete their own URLs after login
  if (users[idVal]) {
    // Deletes the key-value pair on click of delete button
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    console.log(`Cannot delete URL as user is not logged in.`);
    res.send(`Cannot delete URL as user is not logged in.`);
  }
});


app.post('/urls/:shortURL', (req,res) => {
  // Updates the longURL on click of Submit button
  urlDatabase[req.params.shortURL].longURL = req.body["longURL"];
  res.redirect("/urls");
});


app.post('/login', (req,res) => {
  const foundUser = emailCheck(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    console.log("Email ID and/or Password is blank");
    res.send(`Error: Status Code: 400. Email ID and/or Password cannot be blank.`);
  } else if (!foundUser) {
    console.log("Email ID does not exist!");
    res.send(`Error: Status Code: 403. Email ID does not exist.`);
  } else if (foundUser) {
    const result = bcrypt.compareSync(req.body.password, foundUser.password);
    if (result) {
      res.cookie('user_id',foundUser.id);
      console.log('Cookies: ', req.cookies);
      res.redirect('/urls');
    } else {
      console.log("Incorrect password!");
      res.send(`Error: Status Code: 403. Incorrect password.`);    
    }
  }
});


app.post('/logout', (req,res) => {
  res.clearCookie('user_id');
  //res.redirect('/urls');
  res.redirect('/login');
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
    const randomId = generateRandomString();
    const hashedPwd = hashedPassword(req.body.password);
    users[randomId] = {id: randomId, email: req.body.email , password: hashedPwd};
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