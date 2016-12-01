const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const dialogue = require('dialoguejs');
const app = express();
var db, currentUser, users;

//values for when canvas width is 1000
var shapeDict = [
  {'autopsy': {'url': '/autopsy-report', 'shape': [610, 120, 325, 50]}, 
  'alton': {'url': '/alton', 'shape': [100, 100, 60, 60]},
  'anarchy': {'url': '/agitator/attack', 'shape': [400, 190, 60, 65]},
  'abandon': {'url': '/dives-dead', 'shape': [70, 460, 60, 60]}},
  {'american': {'url': '/american', 'shape': [70, 460, 60, 60]},
  'anarchy': {'url': '/agitator/harbor', 'shape': [400, 190, 60, 65]},
  'nonsense': {'url': '#', 'shape': [620, 100, 100, 50]},
  'numerology': {'url': '#', 'shape': [100, 100, 60, 60]},
  'myth': {'url': '#', 'shape': [200, 200, 60, 60]}}
];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
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
    shapes: buildRevisedShapes(req.user.act, req.user.act1pt2)
  });
});

app.get('/login', (req, res) => {
  res.render('pages/login');
})

app.post('/login', (req, res) => {
  var rb = req.body;
  //test if we need to run this find again
  users.findOne({name: rb.name}, (err, result) => {
    if(err) return console.log(err);
    var direct = function(data) {
      req.session.user = data;
      res.redirect('/');
    }
    result? direct(result) : newUser(rb, direct);
  });
});

app.get('/chat', requireLogin, (req, res) => {
  res.render('pages/chat', {
    name: req.user.name,
    convo: req.user.convo
  });
});

app.post('/chat', requireLogin, (req, res) => {
  updateUserData(req.user.name, {convo: req.body});
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

app.get('/agitate', requireLogin, (req, res) => {
  res.render('pages/agitator', {
    convo: null,
    article: req.query.a,
    date: req.query.d
  });
});


/*--------------- Evidence Pages --------------*/

app.get('/autopsy-report', requireLogin, (req, res) => {
  if(!req.user.autopsy) {
    updateUserData(req.user.name, {autopsy: true}, unlockAct1Future);
  }
  res.render('pages/autopsy-report');
});

//subpage from /autopsy-report
app.get('/myositis', requireLogin, (req, res) => {
  res.render('pages/myositis');
});

app.get('/alton', requireLogin, (req, res) => {
  res.render('pages/alton', {
    mayor: false,
    altered: false
  });
});

app.get('/alton/mayor', requireLogin, (req, res) => {
  if(!req.user.alton) {
    updateUserData(req.user.name, {alton: true}, unlockAct1Future);
  }
  res.render('pages/alton', {
    mayor: true,
    altered: false
  });
});

app.get('/alton/mayor/altered', requireLogin, (req, res) => {
  if(!req.user.act < 2) {
    updateUserData(req.user.name, {act: 2});
  }
  res.render('pages/alton', {
    mayor: true,
    altered: true
  });
});

app.get('/agitator/:article', requireLogin, (req, res) => {
  var article = req.params.article;
  var convo, date;
  if(article == 'attack') {
    date = 'Oct. 26, 2037'
    if(!req.user.convo[0].end) {
      convo = false;
      if(!req.user.convo[0].start) {
        req.user.convo[0].start = true;
        updateUserData(req.user.name, {convo: req.user.convo});
      }
    } else {
      convo = true;
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

app.get('/dives-dead', requireLogin, (req, res) => {
  res.render('pages/dives');
});

//act ii

app.get('/american', requireLogin, (req, res) => {
  res.render('pages/american');
});

/*------------- Functions ---------------*/

function updateUserData(username, data, cb) {
  users.findOneAndUpdate(
    {name: username},
    {$set: data},
    {returnOriginal: false},
    (err, result) => {
      if(err) return console.log(err);
      console.log(result.value);
      if(cb) cb(result.value);
    });
}

function requireLogin(req, res, next) {
  if(!req.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

function buildRevisedShapes(act, act1pt2) {
  var shapes = {};
  Object.keys(shapeDict[act-1]).forEach(function(key, value) {
    shapes[key] = shapeDict[key];
  });
  if(act == 1 && !act1pt2) {
    delete shapes.anarchy;
    delete shapes.abandon;
  } else if(act == 2) {
    if(!act2pt2) {
      delete shapes.anarchy;
      delete shapes.american;
    }
    if(!act2pt3) {
      delete shapes.nonsense;
    }
  }
  return shapes;
}

function newUser(data, cb) {
  data.act = 1;
  data.autopsy = false;
  data.alton = false;
  data.act1pt2 = false;
  data.act2pt2 = false;
  data.act2pt3 = false;
  data.convo = [
    {'id': 1, 'start': false, 'end': false},
    {'id': 2, 'start': false, 'end': false}
  ];
  users.save(data, (err, result) => {
    if(err) return console.log(err)
    console.log('saved to database')
    cb(data);
  });
}

/*------------- State-Specific Functions ---------------*/

function unlockAct1Future(u) {
  if(u.autopsy && u.alton) {
    updateUserData(u.name, {act1pt2: true});
  }
}
