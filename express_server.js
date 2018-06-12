const express = require("express");
const ejs = require("ejs");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {errors : []});
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  var newShort = generateRandomString();
  var errors = []
  if (!req.body.longURL) {
    errors.push('URL is required')
  }
  if (errors.length > 0){
    res.send(errors[1])
    // res.render('urls/new', {errors: errors})
  } else{
    urlDatabase[newShort] = req.body.longURL;
    urlDatabase;
    res.redirect('/urls');
    }

  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  console.log(longURL)
  res.redirect(longURL);
});

function generateRandomString (){
  var rand = '';
  rand = Math.random().toString(36).substring(2,8);
  return rand;
}
