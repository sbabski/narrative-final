const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
var db;

var anarchy = false;
var future = false;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
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
  var users = db.collection('users').find().toArray( (err, results) => {
    if (err) return console.log(err)
    console.log(results)
  })
  res.render('pages/index', {
    anarchy: anarchy
  });
});

app.get('/autopsy-report', (req, res) => {
  anarchy = true;
  res.render('pages/autopsy-report');
});

app.get('/anarchist-newspaper', (req, res) => {
  res.render('pages/anarchist-newspaper');
});
