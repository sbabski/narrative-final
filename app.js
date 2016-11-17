const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const app = express();
var db, currentUser, users;

var future = false;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(session({
  cookieName: 'session',
  secret: 'tom-waits-is-grits',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));
app.set('view engine', 'ejs')

MongoClient.connect('mongodb://localhost:27017/', (err, database) => {
  db = database;
  users = db.collection('users');
  if (err) return console.log(err)
  console.log('successfully connected to the database');
  app.listen(5000, () => {
    console.log('listening on 5000')
  })
});

app.get('/', (req, res) => {
  if(req.session && req.session.user) {
    users.findOne({name: req.session.user.name}, (err, u) => {
      if(err) console.log(err);
      res.render('pages/index', {
        anarchy: u.anarchy
      });
    });
  } else {
    res.render('pages/login');
  }
});

app.post('/login', (req, res) => {
  var rb = req.body;
  rb.name = rb.name.toLowerCase();
  users.findOne({name: rb.name}, (err, result) => {
    if(err) return console.log(err)
    if(!result) {
      rb.future = false;
      rb.anarchy = false;
      rb.convo1 = false;
      console.log('here');
      users.save(rb, (err, result) => {
        if(err) return console.log(err)
        console.log('saved to database')
      });
      req.session.user = rb;
    } else {
     console.log('here 2');
     req.session.user = result;
    }
    res.redirect('/');
  });

});

app.get('/autopsy-report', (req, res) => {
  updateUserData(req.session.user['name'], {anarchy: true});
  res.render('pages/autopsy-report');
});

app.get('/anarchist-newspaper', (req, res) => {
  if(req.session && req.session.user) {
    users.findOne({name: req.session.user.name}, (err, u) => {
      if(err) console.log(err);
      res.render('pages/anarchist-newspaper', {
        convo: u.convo1
      });
      if(u.convo1 == false) {
        updateUserData(req.session.user['name'], {convo1: true});
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/myositis', (req, res) => {
  res.render('pages/myositis');
});

app.get('/chat', (req, res) => {
  res.render('pages/chat');
});

app.get('/dropdb', (req, res) => {
  db.collection('users').drop();
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

function updateUserData(username, data) {
  users.findOneAndUpdate(
    {name: username},
    {$set: data},
    (err, result) => {
      if(err) return console.log(err)
    });
}
