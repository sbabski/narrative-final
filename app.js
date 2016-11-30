const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const dialogue = require('dialoguejs');
const app = express();
var db, currentUser, users;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))
app.use(session({
  cookieName: 'session',
  secret: 'tom-waits-is-grits',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));
app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    users.findOne({name: req.session.user.name}, (err, u) => {
      if(err) console.log(err);
      req.user = u;
      next();
    });
  } else {
    next();
  }
});
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

/*------------- Routes ---------------*/

app.get('/', requireLogin, (req, res) => {
  res.render('pages/index', {
    shapes: buildRevisedShapes(req.user.anarchy)
  });
});

app.get('/login', (req, res) => {
  res.render('pages/login');
})

app.post('/login', (req, res) => {
  var rb = req.body;
  //test if we need to run this find again
  users.findOne({name: rb.name}, (err, result) => {
    if(err) return console.log(err)
    if(!result) {
      rb.future = false;
      rb.anarchy = false;
      rb.convo1 = false;
      users.save(rb, (err, result) => {
        if(err) return console.log(err)
        console.log('saved to database')
      });
      req.session.user = rb;
    } else {
     req.session.user = result;
    }
    res.redirect('/');
  });

});

app.get('/chat', requireLogin, (req, res) => {
  res.render('pages/chat', {
    name: req.user.name,
    convo: req.user.convo1
  });
});

app.get('/dropdb', (req, res) => {
  if(req.session && req.session.user) {
    req.session.reset();
  }
  db.collection('users').drop();
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

/*--------------- Evidence Pages --------------*/

app.get('/autopsy-report', requireLogin, (req, res) => {
  //contributes to anarchy unlocking
  updateUserData(req.user.name, {anarchy: true});
  res.render('pages/autopsy-report');
});

app.get('/myositis', requireLogin, (req, res) => {
  res.render('pages/myositis');
});

app.get('/mayor', requireLogin, (req, res) => {
  //contributes to anarchy unlocking
  res.render('pages/mayor');
});

app.get('/agitator/:article', requireLogin, (req, res) => {
  var article = req.params.article;
  var convo, date;
  if(article == 'attack') {
    convo = req.user.convo1;
    date = 'Oct. 26, 2037'
    if(convo == false) {
      updateUserData(req.user.name, {convo1: true});
    }
  } else if (article == 'harbor') {
    convo = null;
    date = 'Dec. 13, 2037';
  } else {
    return res.redirect('/');
  }
  res.render('pages/agitator', {
    convo: convo,
    article: article,
    date: date
  });
});

/*------------- Other ---------------*/

function updateUserData(username, data) {
  console.log(username);
  users.findOneAndUpdate(
    {name: username},
    {$set: data},
    (err, result) => {
      if(err) return console.log(err)
    });
}

function requireLogin(req, res, next) {
  if(!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

//values for when canvas width is 1000
var shapeDict = {
  'autopsy': {'url': '/autopsy-report', 'shape': [610, 120, 325, 50]}, 
  'mayor': {'url': '/mayor', 'shape': [100, 100, 40, 40]},
  'anarchy': {'url': '/agitator/attack', 'shape': [400, 190, 60, 65]}
};

function buildRevisedShapes(anarchy) {
  var shapes = shapeDict;
  if(anarchy) delete shapes.anarchy;
  return shapes;
}
