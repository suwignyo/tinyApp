const express = require("express");
// const ejs = require("ejs");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const render404 = res => {
  res.status(404).render("404");
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
  let id = req.params.id;
  let templateVars = { shortURL: id, longURL: urlDatabase[id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/edit", (req, res) => {
  let id = req.params.id;
  // console.log(req.body)
  // console.log(urlDatabase)
  urlDatabase[id] = req.body.longurl;
  res.redirect("/urls");
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

  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
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

// GET /dogs/:id/edit - Update Form
// app.get("/urls/:id/edit", (req, res) => {
//   const url = req.params.id;
//   if (url) {
//     res.render("url/edit/", { dog: dog });
//   } else {
//     render404(res);
//   }
// });


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
