// Requirements
var express = require('express');
var app = express();
var favicon = require('serve-favicon');
var path = require('path');

const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

Score = require('./models/Score');
Playlist = require('./models/Playlist');
Game = require('./models/Game');

// Connect to Mongoose
mongoose.connect('mongodb://localhost:27017/whereami', {useNewUrlParser: true}, (err) => {
  if (err) throw err;
  console.log("Connected to MongoDB database!");
});
var db = mongoose.connection;

// Specify public directory (to serve static files)
app.use(express.static('public'));

// Use a favicon
app.use(favicon(path.join(__dirname, 'public', 'img/favicon.ico')));

// Home route
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/views/home.html');
});

// Score - POST
app.post('/api/score', (req, res) => {

  Score.addScore(req.body, (err) => {
    if (err) throw err;
    console.log("Score added!");
    res.json(req.body);
  });
});

// Score - GET
app.get('/api/score', (req, res) => {
  
  Score.getScores((err, scores) => {
    if (err) throw err;
    res.json(scores);
  });
});

// Playlist - GET
app.get('/api/playlist', (req, res) => {
  Playlist.getPlaylist(req.query, (playlist) => {
    res.send(playlist);
  });
});


// View game - GET
app.get('/game/:gameID', (req, res) => {
  var gameID = req.params.gameID;
  res.send(gameID);
});

// Game - POST
app.post('api/game/', (req, res) => {
  Game.addGame(req.body, (err) => {
    if (err) throw err;
    console.log("Game added!");
    res.json(req.body);
  });
});


// Run the web server using Express
app.listen(3000, () => console.log('The application is running on localhost:3000!'));