// This module doesn't use a local database,
// instead it fetches data from Snapchat's API.

var snapMap = require('snapmap');
var cities = require('../verifiedCities.json');
var goodCitiesFilename = 'verifiedCities.json';

var timeago = require("timeago.js");
var fs = require('fs');
var path = require('path');


// Constants
const RADIUS = 3000;    // in metres
const ZOOM = 2;         // between 2-18
var numStories = 5;     // the min. amount of stories a successful playlist must have

/**
 * Returns a playlist contains zero or many 'stories' for a given city
 * @param {*} city  The city for which the stories will be searched for
 */
module.exports.getPlaylist = (req) => {
  return new Promise(async function(resolve, reject) {
    var pl;
    var city;
    var timeoutCount = 0;
    
    // Repeat until timeout count is hit - prevents the server from sending too many requests to the Snapchat servers
    while (timeoutCount <= 2) {
      city = await getCity(req);

      // A playlist that contains stories (i.e. a set of related clues for a single location)
      pl = await snapMap.getPlaylist(city.lat, city.lng, RADIUS, ZOOM);
      
      console.log(`${city.city}, ${city.country} - ${pl.totalCount} stories found!`);

      // If stories exist, and the playlist contains the min. amount of stories...
      if (!isNaN(pl.totalCount) && pl.totalCount >= numStories) {
        pl = await processPlaylist(pl, city);
        return resolve(pl);
      }
      else {
        timeoutCount++;
      }
    }
    
    // Timeout count hit
    reject({err: "Please refresh the page. We apologise for the inconvenience."});
  })
}

/**
 * Pulls a random city JSON object from cities.json.
 */
function getCity(req) {
  
  return new Promise(function(resolve, reject) {
    let i=0;
    let condition = i>0;
  
    if (req.include) {
      var countries = req.include.split(",");
      var included = countries.map(function(c){ return c.toUpperCase() });
      condition = "(!included.includes(city.country.toUpperCase()))";
    }
  
    else if (req.exclude) {
      var countries = req.exclude.split(",");
      var excluded = countries.map(function(c){ return c.toUpperCase() });
      condition = "(excluded.includes(city.country.toUpperCase()))";
    }
  
    // Find random city and print it
    do {
      var city = cities[Math.floor(Math.random()*cities.length)];
      // console.log(city.city + ", " + city.country);
  
      i++;
    } 
  
    
    while (eval(condition));
  
    resolve(city);
  });
}

/**
 * 
 * @param {*} playlist  The playlist containing stories.
 * @param {*} res       The response object to be sent back to the client.
 * @param {*} city      The name of the city 
 */
function processPlaylist(playlist, city, _callback) {
  return new Promise(function(resolve, reject) {
    stories = [];   // Holds minStories amount of stories
    story_ids = [];
  
    // Get random stories from playlist
    for (var i=0; i<numStories; i++) {
  
      // Make sure that the story hasn't already been picked.
      do {
        var num = [Math.floor(Math.random()*playlist.totalCount)]; 
      } while (story_ids.includes(playlist.elements[num].id));
  
      stories.push({});
      story_ids.push(playlist.elements[num].id);
  
      // Get timestamp for each story - How long ago was the story posted?
      let timestamp = playlist.elements[num].timestamp;
      stories[i].timestamp = timeago.format(timestamp);
  
      // It's a video
      if (playlist.elements[num].snapInfo.streamingMediaInfo) {
        // Find suffix (depending whether there is an overlay or not)
        var suffix = playlist.elements[num].snapInfo.streamingMediaInfo.mediaWithOverlayUrl 
        // -- video has snapchat overlay --
        ? playlist.elements[num].snapInfo.streamingMediaInfo.mediaWithOverlayUrl
        // -- video doesn't have overlay --
        : playlist.elements[num].snapInfo.streamingMediaInfo.mediaUrl;
  
        stories[i].storyURL = playlist.elements[num].snapInfo.streamingMediaInfo.prefixUrl + suffix;
  
        stories[i].isImage = false;
      } 
      
      // It's an image
      else {
        stories[i].storyURL = playlist.elements[num].snapInfo.publicMediaInfo.publicImageMediaInfo.mediaUrl;
        stories[i].isImage = true;
      }
    }
  
    // console.log(city.city + ", " + city.country + " - " + playlist.totalCount + " stories found!");
    addCity(city); 
  
    // Initalise playlist object
    playlist = {};
  
    playlist.coords = {lat: city.lat, lng: city.lng};
    playlist.stories = stories;
    playlist.location = {city: city.city, country: city.country};
  
    resolve(playlist);
  });
}


/**
 * Adds a city to the curated list of verified cities. This should let rounds be loaded quicker.
 * @param {*} city A city object, containing: city[name], country, lat, lng.
 */
function addCity(city) {

  var cityData = {
    city: city.city,
    country: city.country,
    lat: city.lat,
    lng: city.lng
  };

  var data = fs.readFileSync(goodCitiesFilename);
  var goodCities = JSON.parse(data);

  // If the city is not already saved to the file, then add it.
  if (!goodCities.some(c => (c.lat == city.lat) && (c.lng == city.lng))) {
    goodCities.push(cityData);
    fs.writeFileSync(goodCitiesFilename, JSON.stringify(goodCities), function(err) {
      if (err) throw err;
    });
  }
}