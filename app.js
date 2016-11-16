const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const app = express();
var db, user;

var anarchy = false;
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
  db = database
  if (err) return console.log(err)
  console.log('successfully connected to the database');
  app.listen(5000, () => {
    console.log('listening on 5000')
  })
});

app.get('/', (req, res) => {
  if(req.session && req.session.user) {
    db.collection('users').findOne({name: req.session.user}, (err, result) => {
      if(err) return console.log(err)
      user = result
    });
    res.render('pages/index', {
      anarchy: anarchy
    });
  } else {
    //var users = db.collection('users').find().toArray( (err, results) => {
      //if (err) return console.log(err)
      //if new user, create db element
      //else, just load data
      //console.log(results)
    //});
    //return console.log('trying login');
    res.render('pages/login');
  }
});

app.post('/', (req, res) => {
  console.log(req.body);
});

app.get('/autopsy-report', (req, res) => {
  anarchy = true;
  res.render('pages/autopsy-report');
});

app.get('/anarchist-newspaper', (req, res) => {
  res.render('pages/anarchist-newspaper');
});
