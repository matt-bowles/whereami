const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const Account = require('../models/Account');

function inititalisePassport(passport) {
  
  passport.use(new LocalStrategy(
    function(username, password, done) {
      Account.findOne({ username: username }, function (err, acc) {

        console.log(acc);

        // Check for any errors that somehow occured
        if (err) return done(err);

        // Check if account exists
        if (!acc) return done(null, false, { message: "Username invalid"} );
        
        // Check if password matches  
        bcrypt.compare(password, acc.password, (err, res) => {
          res ?
          done(null, acc, "Logged in") :
          done(null, false, "Password incorrect");
        });

      });
    }
  ));

  passport.serializeUser((acc, done) => done(null, acc));
  passport.deserializeUser((acc, done) => { done(null, acc) });
}

module.exports = inititalisePassport;