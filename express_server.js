const express = require("express");
// const ejs = require("ejs");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['key1'],
}))

app.use(bodyParser.urlencoded({
  extended: true
}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    long_URL: "http://www.lighthouselabs.ca",
    owner: "user"
  },
  "9sm5xK": {
    long_URL: "http://www.google.com",
    owner: "userRandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("pass1", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("pass2", 10)
  },
  "user": {
    id: "user",
    email: "user@3.com",
    password: bcrypt.hashSync("pass3", 10)
  }
}

app.get("/", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

/* Front page of Tiny App, when no user is logged in
it will show a login and register page
*/
app.get("/urls", (req, res) => {
  let templateVars = {
    errors: errors,
    urls: urlsForUser(req.session.user_ID),
    username: req.session.user_ID,
    user: users[req.session.user_ID]
  }
  var errors = [];
  res.render("urls_index", templateVars);
});

/* When user are logged in, the page shows the short URL
associated with user
*/
app.post("/urls", (req, res) => {
  var newShort = generateRandomString();
  var errors = [];

  if (!req.body.longURL) {
    errors.push('URL is required')
  }
  if (errors.length > 0) {
    res.status('400')
    res.render('urls_new', {
      errors: errors,
      user: users[req.session.user_ID]
    })
  } else {
    urlDatabase[newShort] = {
      "long_URL": req.body.longURL,
      "owner": req.session.user_ID
    };
    res.redirect('/urls');
  }
})

/* If user is logged in, user can create a new shortened URL
 */
app.get("/urls/new", userAuthentication, (req, res) => {
  let templateVars = {
    errors: [],
    urls: urlDatabase,
    username: req.session.user_ID,
    user: users[req.session.user_ID]
  };
  res.render("urls_new", templateVars);
});

/* If user is logged in, user is able to edit the long URL
associated with the shortened URL, if another user tries to go here
it will give them an error
*/
app.get("/urls/:id", (req, res) => {
  let id = req.params.id;
  let templateVars = {
    shortURL: id,
    longURL: urlDatabase[id].long_URL,
    username: req.session.user_ID,
    user: users[req.session.user_ID]
  };
  let owns = urlDatabase[id].owner
  if (req.session.user_ID && (req.session.user_ID === owns)) {
    res.render("urls_show", templateVars);
    return
  }
  res.send("Please login").status(400);
});

/* Edits user long URL and shows it in user's homepage
 */
app.post("/urls/:id/edit", userAuthentication, (req, res) => {
  let id = req.params.id;
  urlDatabase[id].long_URL = req.body.name;
  res.redirect("/urls");
});

/* Any user can be redirected to a long URL given the right short URL
 */
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  for (i in urlDatabase) {
    if (req.params.shortURL === i) {
      res.redirect(longURL.long_URL);
    }
  }
  res.sendStatus(400);
});

/* Deletes user's shortURL from the database
 */
app.post("/urls/:id/delete", userAuthentication, (req, res) => {
  const url = req.params.id
  if (req.session.user_ID === urlDatabase[url].owner) {
    delete urlDatabase[url]
  } else {
    res.redirect('/login');
    return;
  }
  res.redirect('/urls');
});

/*If user is logged in, will be redirected to their homepage,
otherwise they will see the login screen
*/
app.get("/login", (req, res) => {
  let templateVars = {
    errors: [],
    urls: urlDatabase,
    username: req.session.user_ID,
    user: users[req.session.user_ID]
  };
  if (!req.session.user_ID) {
    res.render("urls_login", templateVars);
    return;
  }
  res.redirect('/urls');
});

/*Checks user credential, will give the appropriate errors depending
on error, otherwise it will log user in
*/
app.post("/login", (req, res) => {
  var errors = []
  var count = 0
  if (req.body.email === '') {
    errors.push('Please provide an email')
    res.render('urls_login', {
      errors: errors,
      user: users[req.session.user_ID]
    })
    return;
  }
  if (req.body.password === '') {
    errors.push('Please enter a password')
    res.render('urls_login', {
      errors: errors,
      user: users[req.session.user_ID]
    });
    return;
  }
  for (id in users) {
    if (users[id].email === req.body.email) {
      count += 1
      if (bcrypt.compareSync(req.body.password, users[id].password)) {
        req.session.user_ID = users[id].id;
        res.redirect("/urls");
        return;
      }
      if (!bcrypt.compareSync(req.body.password, users[id].password)) {
        errors.push('Incorrect password')
        res.render('urls_login', {
          errors: errors,
          user: users[req.session.user_ID]
        })
        return;
      }
    }
  }
  if (count === 0) {
    errors.push('Please provide a valid email')
    res.render('urls_login', {
      errors: errors,
      user: users[req.session.user_ID]
    })
    return;
  }
  res.render('urls_login', {
    errors: errors,
    user: users[req.session.user_ID]
  });
});

/*Logs out user and clearing the session cookie
 */
app.post("/logout", (req, res) => {
  // let id = req.params.id;
  req.session = null;
  res.redirect("/urls");
});

/*If user is logged in, will be redirected to their homepage,
otherwise they will see the register screen
*/
app.get("/register", (req, res) => {
  let templateVars = {
    errors: [],
    urls: urlDatabase,
    username: req.session.user_ID,
    user: users[req.session.user_ID]
  };
  if (!req.session.user_ID) {
    res.render("urls_register", templateVars);
    return;
  }
  res.redirect('/urls');
});

/*Checks user credential, will give the appropriate errors depending
on error, otherwise it will register the user
*/
app.post("/register", (req, res) => {
  let newID = generateRandomString()
  var errors = []
  if (req.body.email === '') {
    errors.push('Please provide an email')
    res.render('urls_register', {
      errors: errors,
      user: users[req.session.user_ID]
    })
    return;
  }
  if (req.body.password === '') {
    errors.push('Please enter a password')
    res.render('urls_register', {
      errors: errors,
      user: users[req.session.user_ID]
    })
    return;
  }
  for (id in users) {
    if (users[id].email === req.body.email) {
      errors.push("Username exists")
    }
  }
  if (errors.length > 0) {
    res.status('400')
    res.render('urls_register', {
      errors: errors,
      user: users[req.session.user_ID]
    })

  } else {
    users[newID] = {
      id: newID,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    req.session.user_ID = newID;
    res.redirect('/urls');
  }
});

/*Generates a random string for the short URL
 */
function generateRandomString() {
  var rand = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++){
    rand += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return rand;
}

/*Checks if user is logged in or not
 */
function userAuthentication(req, res, next) {
  if (req.session.user_ID) {
    next();
  } else {
    res.redirect('/login');
  }
}

/*creates an object containing only their shortened URL
 */
function urlsForUser(idCookie) {
  let temp = {}
  for (userid in urlDatabase) {
    if (urlDatabase[userid].owner === idCookie) {
      temp[userid] = {
        long_URL: urlDatabase[userid].long_URL
      }
    }
  }
  return temp
}