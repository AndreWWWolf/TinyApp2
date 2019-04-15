const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const PORT = 8080;
const morgan = require('morgan');
// separated helper functions to a separate module
const helpers = require('./functions');
const bcrypt = require('bcrypt');
// const methodOverride = require('method-override');
const moment = require('moment');

const urlDatabase = {
  /*
    shortURL: {
      longURL :,
      userID :,
      time:
    }
  */
};

const users = {
  /*
    user: {
      id:,
      email:,
      password:
    }
  */
};

const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieSession({
  keys: ['user_id']
}));
app.use(morgan('dev'));
// app.use(methodOverride('_method'));

// takes client to home page ('/urls')
app.get('/', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// redirects the client to the longURL
app.get('/u/:shortURL', (req, res) => {
  let currentUser = req.session.user_id;
  let templateVars = {
    user: users[currentUser]
  }
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.render('urls_not_found', templateVars);
  }

});

// renders index page on get request
app.get('/urls', (req, res) => {
  let currentUser = req.session.user_id;
  // urlsForUser returns obj list containing URLs that belong to current user
  let userURLs = helpers.urlsForUser(urlDatabase, currentUser);
  let templateVars = {
    user: users[currentUser],
    urls: userURLs
  };
  res.render('urls_index', templateVars);
});

// creates a new short url on post request if the user is logged in, if posting without user auth, redirects back to /urls to tell user to log in
app.post('/urls/new', (req, res) => {
  if (req.session.user_id) {
    // make sure user is logged in and received input
    if (req.body.longURL) {
      // generateStr() returns a 6 length string that was randomly generated
      let newShortURL = helpers.generateStr();
      let currentTime = moment.utc().local().format('YYYY-MM-DD hh:mm:ss a');
      console.log(currentTime);
      // make sure there isnt an existing short URL with the same random string
      if (urlDatabase[newShortURL]) {
        newShortURL = helpers.generateStr();
      } else {
        urlDatabase[newShortURL] = {
          longURL: req.body.longURL,
          userID: req.session.user_id,
          time: currentTime
        };
      }
      res.redirect(`/urls/${newShortURL}`);
    } else {
      let currentUser = req.session.user_id;
      let templateVars = {
        user: users[currentUser],
        urls: urlDatabase
      };
      res.render("urls_new", templateVars);
    }
  } else {
    res.redirect('/urls');
  }
});

// renders register page on get request
app.get('/register', (req, res) => {
  let currentUser = req.session.user_id;
  if(currentUser) {
    res.redirect('/urls');
  }
  let templateVars = {
    user: users[currentUser],
    urls: urlDatabase
  };
  res.render('urls_registration', templateVars);
});

// creates an user account in the database on post request, no prior user auth checked.
app.post('/register', (req, res) => {
  let currentUser = req.session.user_id;
  let templateVars = {
    user: users[currentUser]
  };
  let newId = helpers.generateStr();
  let newEmail = req.body.email;
  let newPassword = bcrypt.hashSync(req.body.password, 10);
  // make sure some input is received
  if (!newEmail || !req.body.password) {
    //
    res.render('urls_empty_fields', templateVars);
    // renders the email error page if an prior account with same email is found
    // emailCheck returns boolean value to check if entered email is already in user database
  } else if (helpers.emailCheck(users, newEmail)) {
    res.render('urls_email', templateVars);
  } else {
    // make sure there isn't duplicate user ids
    if (users[newId]) {
      newId = helpers.generateStr();
    } else {
      users[newId] = {
        id: newId,
        email: newEmail,
        password: newPassword
      };
      req.session.user_id = newId;
    }
  }
  res.redirect('/urls');
});

// renders the login page for the client
app.get('/login', (req, res) => {
  let currentUser = req.session.user_id;
  if(currentUser) {
    res.redirect('/urls');
  }
  let templateVars = {
    user: users[currentUser],
    urls: urlDatabase
  };
  res.render('urls_login', templateVars);
});

// on post request to /login, checks if inputted email exists, and if so checks if entered password matches the hashed password from registation, redirects the client to home page on completion and to error pages if bad request were made
app.post('/login', (req, res) => {
  let currentUser = req.session.user_id;
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  let templateVars = {
    user: users[currentUser]
  };
  // getUserID returns a string, the userID for the user if email matches with the database
  let userID = helpers.getUserID(users, loginEmail);
  if (!userID) {
    // displays error page of non existing account to client
    res.render('urls_no_account', templateVars);
  } else if (!bcrypt.compareSync(loginPassword, users[userID].password)) {
    // displays error page if passwords do not match
    res.render('urls_input_error', templateVars);
  } else {
    req.session.user_id = userID;
    res.redirect('/urls');
  }
});

// clears user's cookies on log out
app.post('/logout', (req, res) => {
  res.clearCookie('express:sess');
  res.clearCookie('express:sess.sig');
  res.redirect('/urls');
});

// checks to see if shortURL is under client's account, deletes if it is and sends 403 if not
// *For METHOD OVERRIDE use:
// app.delete('/urls/:shortURL/delete', (req, res) => {
//   if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
  // instead of next 3 lines
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log(urlDatabase[req.params.shortURL]);
  if (urlDatabase[req.params.shortURL].getUserID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send("You do not own this shortURL or not logged in!");
  }
});

// renders page to create new url link, redirects to login if user is not logged in
app.get('/urls/new', (req, res) => {
  if (req.session.user_id) {
    let currentUser = req.session.user_id;
    let templateVars = {
      user: users[currentUser],
      urls: urlDatabase
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }

});

// gets shortURL data if user is logged in, if shortURL is not in database, renders a not found page for client
app.get('/urls/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let currentUser = req.session.user_id;
    let templateVars = {
      user: users[currentUser],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      userID: urlDatabase[req.params.shortURL].userID
    };
    res.render("urls_show", templateVars);
  } else {
    let currentUser = req.session.user_id;
    let templateVars = {
      user: users[currentUser]
    };
    res.render("urls_not_found", templateVars);
  }
});

// remaps shortURL redirection to a new longURL specified by client, checks to make sure client owns the shortURL link, shows errors pages if user auth failed or shortURL does not exist
// app.put('/urls/:shortURL', (req, res) => { *FOR METHODOVERRIDE*
  app.post('/urls/:shortURL', (req, res) => {
  if (req.params.shortURL) {
    let currentUser = req.session.user_id;
    if (currentUser === urlDatabase[req.params.shortURL].userID) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      let templateVars = {
        user: users[currentUser],
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        userID: urlDatabase[req.params.shortURL].userID
      };
      res.redirect('/urls');
    } else {
      res.status(403).send('You are not the owner of the short URL or not logged in!');
    }
  } else {
    let currentUser = req.session.user_id;
    let templateVars = {
      user: users[currentUser]
    };
    res.render("urls_not_found", templateVars);
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});