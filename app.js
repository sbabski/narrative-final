const MongoClient = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const session = require('client-sessions');
const dialogue = require('dialoguejs');
//values for when canvas width is 1000
const shapeData = require('./public/shapes.json');
const app = express();
var db, currentUser, users;

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
  app.listen(3000, () => {
    console.log('listening on 3000')
  })
});

/*------------- Routes ---------------*/

app.get('/test', (req, res) => {
  res.render('pages/test');
});

app.get('/', requireLogin, (req, res) => {
  if(req.user.act == 4){
    res.render('pages/end');
  } else {
    res.render('pages/index', {
      shapes: buildRevisedShapes(req.user)
    });
  }
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


//wrong chat pops up after second is started
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

app.get('/reset', requireLogin, (req, res) => {
  var data = {};
  blankUser(data);
  updateUserData(req.user.name, data);
  res.redirect('/');
});

app.get('/agitate', requireLogin, (req, res) => {
  res.render('pages/agitator', {
    convo: null,
    article: req.query.a,
    date: req.query.d
  });
});

app.get('/nonsensical', requireLogin, (req, res) => {
  res.render('pages/nonsense', {
    convo: null,
  });
});

app.get('/final', requireLogin, (req, res) => {
  res.render('pages/final');
});


/*--------------- Evidence Pages --------------*/

//act i

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
    if(!req.user.harbor) {
      updateUserData(req.user.name, {harbor: true}, unlockAct2Nonsense);
    }
    convo = null;
    date = 'Dec. 13, 2037';
  } else if (article == 'exposed') {
    if(!req.user.exposed) {
      updateUserData(req.user.name, {exposed: true});
    }
    convo = null;
    date = 'Dec. 21, 2037';
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

app.get('/myth', requireLogin, (req, res) => {
  if(!req.user.myth) {
    updateUserData(req.user.name, {myth: true}, unlockAct2Future);
  }
  res.render('pages/myth');
});

app.get('/numerology', requireLogin, (req, res) => {
  if(!req.user.numerology) {
    updateUserData(req.user.name, {numerology: true}, unlockAct2Future);
  }
  res.render('pages/numerology');
});

app.get('/american', requireLogin, (req, res) => {
  if(!req.user.american) {
    updateUserData(req.user.name, {american: true}, unlockAct2Nonsense);
  }
  res.render('pages/american');
});

//act iii

app.get('/fbi-confidential', requireLogin, (req, res) => {
  res.render('pages/force');
});

app.get('/seized-domain', requireLogin, (req, res) => {
  res.render('pages/seized');
});

app.get('/thompson', reqireLogin, (req, res) => {
  res.render('pages/thompson');
});

//act iv

app.get('/nonsense', requireLogin, (req, res) => {
  var convo;
  if(!req.user.convo[1].end) {
    convo = false;
    if(!req.user.convo[1].start) {
      req.user.convo[1].start = true;
      updateUserData(req.user.name, {convo: req.user.convo});
    }
  } else {
    convo = true;
  }
  res.render('pages/nonsense', {
    convo: convo
  });
});

app.get('/nonsense-next', requireLogin, (req, res) => {
  if(!req.user.act < 3) {
    updateUserData(req.user.name, {act: 4});
  }
  res.redirect('/');
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

function buildRevisedShapes(u) {
  var shapes = {};
  Object.keys(shapeData[u.act-1]).forEach(function(key, value) {
    shapes[key] = shapeData[u.act-1][key];
  });
  if(u.act == 1 && !u.act1pt2) {
    delete shapes.anarchy;
    delete shapes.abandon;
  } else if(u.act == 2) {
    if(!u.act2pt2) {
      delete shapes.anarchy;
      delete shapes.american;
    }
    if(!u.act2pt3) {
      delete shapes.nonsense;
    }
  }
  return shapes;
}

function newUser(data, cb) {
  blankUser(data);
  users.save(data, (err, result) => {
    if(err) return console.log(err)
    console.log('saved to database')
    cb(data);
  });
}

function blankUser(data) {
  data.act = 1;
  data.autopsy = false;
  data.alton = false;
  data.act1pt2 = false;
  data.myth = false;
  data.numerology = false;
  data.act2pt2 = false;
  data.american = false;
  data.harbor = false;
  data.act2pt3 = false;
  data.exposed = false;
  data.convo = [
    {'id': 1, 'start': false, 'end': false},
    {'id': 2, 'start': false, 'end': false}
  ];
}

/*------------- State-Specific Functions ---------------*/

function unlockAct1Future(u) {
  if(u.autopsy && u.alton) {
    updateUserData(u.name, {act1pt2: true});
  }
}

function unlockAct2Future(u) {
  if(u.myth && u.numerology) {
    updateUserData(u.name, {act2pt2: true});
  }
}

function unlockAct2Nonsense(u) {
  if(u.american && u.harbor) {
    updateUserData(u.name, {act2pt3: true});
  }
}
