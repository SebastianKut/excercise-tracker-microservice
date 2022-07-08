const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const MUUID = require('uuid-mongodb');

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let userData = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
app.post('/api/users', (req, res) => {
  if (!req.body.username) throw new Error('User name required');

  const newUser = {
    username: req.body.username,
    _id: MUUID.v4().toString(),
    log: [],
  };
  userData.push(newUser);
  res.send({
    username: newUser.username,
    _id: newUser._id,
  });
  console.log('all users', userData);
});

app.get('/api/users', (req, res) => {
  const users = userData.map((user) => {
    return { _id: user._id, username: user.username };
  });
  res.send(users);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const foundUser = userData.find((user) => user._id === req.params._id);

  if (!foundUser) throw new Error('User does not exist');

  if (!req.body.description || !req.body.duration)
    throw new Error('Description and duration required');
  if (isNaN(req.body.duration) || Number(req.body.duration < 1))
    throw new Error('Duration must be a number > 1');

  const date = req.body.date
    ? new Date(req.body.date).toDateString()
    : new Date().toDateString();

  const excercise = {
    description: req.body.description,
    duration: Number(req.body.duration),
    date: date,
  };

  foundUser.log.push(excercise);
  console.log(foundUser);

  res.send({
    _id: foundUser._id,
    username: foundUser.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: date,
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  let foundUser = userData.find((user) => user._id === req.params._id);

  if (!foundUser) throw new Error('User does not exist');

  const limit = req.query.limit;
  const from = req.query.from;
  const to = req.query.to;

  const fromParsed = new Date(from).getTime();
  const toParsed = new Date(to).getTime();

  if (!from && !to && !limit) {
    const count = foundUser.log.length;
    foundUser.count = count;

    return res.send(foundUser);
  }

  if (from) {
    let filteredLog = [];
    foundUser.log.forEach((singleLog) => {
      if (Date.parse(singleLog.date) >= fromParsed) {
        filteredLog.push(singleLog);
      }
    });
    foundUser = {
      ...foundUser,
      log: filteredLog,
      count: filteredLog.length,
    };
    console.log('Filtered from user', foundUser);
  }

  if (to) {
    let filteredLog = [];
    foundUser.log.forEach((singleLog) => {
      if (Date.parse(singleLog.date) <= toParsed) {
        filteredLog.push(singleLog);
      }
    });
    foundUser = {
      ...foundUser,
      log: filteredLog,
      count: filteredLog.length,
    };
    console.log('Filtered from user', foundUser);
  }

  if (limit) {
    let filteredLog = foundUser.log.slice(0, limit);
    foundUser = {
      ...foundUser,
      log: filteredLog,
      count: filteredLog.length,
    };
    console.log('Filtered from user', foundUser);
  }

  res.send(foundUser);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
