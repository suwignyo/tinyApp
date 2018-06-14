const express = require("express");
// const ejs = require("ejs");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

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
  },
  "user": {
    id: "user",
    email: "user@3.com",
    password: "asd"
  }
}

const render404 = res => {
  res.status(404).render("404");
};

const render400 = res => {
  res.status(400).render("400");
};

app.get("/", (req, res) => {
  res.end("Hello!");
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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
  username: req.cookies["username"], user: users[req.cookies.username]};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  var newShort = generateRandomString();
  var errors = []
  if (!req.body.longURL) {
    errors.push('URL is required')
  }
  if (errors.length > 0){
    res.status('400')
    res.render('urls_new', {errors: errors})
  } else{
    urlDatabase[newShort] = req.body.longURL;
    res.redirect('/urls');
    }
})

app.get("/urls/new", userAuthentication, (req, res) => {
  let templateVars = {errors : [], urls: urlDatabase,
  username: req.cookies["username"], user: users[req.cookies.username]}
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let id = req.params.id;
  let templateVars = { shortURL: id, longURL: urlDatabase[id],
  username: req.cookies["username"], user: users[req.cookies.username]};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/edit", (req, res) => {
  let id = req.params.id;
  // console.log(req.body)
  // console.log(urlDatabase)
  urlDatabase[id] = req.body.longurl;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  // let id = req.params.id;
  // res.cookie('username', req.body.username);
  let templateVars = {errors:[], urls: urlDatabase,
  username: req.cookies["username"], user: users[req.cookies.username]};
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  if (req.body.email === '' || req.body.password === ''){
    res.sendStatus(400)
  }
  for (id in users){
    if ((users[id].email === req.body.email) && (users[id].password === req.body.password)){
      res.cookie('username', users[id].id);
      res.redirect("/urls")
      return
    }
  }
  res.sendStatus(400)
  // res.cookie('username', newID);
  // console.log(users);
  // // res.cookie('username', req.cookies.username);
  // res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  // let id = req.params.id;
  res.clearCookie('username', req.body.username);
  res.redirect("/urls");
});


app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  console.log(longURL)
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const url = req.params.id
  if (url) {
    delete urlDatabase[url]
  }
  else{
    render404(res);
  }
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  let templateVars = {errors:[], urls: urlDatabase,
  username: req.cookies["username"], user: users[req.cookies.username]};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let newID = generateRandomString()
  var errors = []
  if (req.body.email === '' || req.body.password === '') {
    res.sendStatus(400)
    // errors.push('Something is required')
  }
  // if (req.body.email === ) {
  // errors.push('URL is required')
  // }
  // if (errors.length > 0){
  //   res.status('400')
  //   res.render('urls_register', {errors: errors})
  // }
  else{
  users[newID] = {id: newID, email: req.body.email, password: req.body.password}
  res.cookie('username', newID);
  console.log(users);
  res.redirect('/urls');
}
});

function generateRandomString (){
  // var rand = '';
  // rand = Math.random().toString(36).substring(2,8);
  // return rand;
  var rand = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    rand += possible.charAt(Math.floor(Math.random() * possible.length));

  return rand;
}

function userAuthentication (req, res, next) {
  if (req.cookies["username"]){
    next();
  }
  else{
    res.redirect('/login')
  }
}