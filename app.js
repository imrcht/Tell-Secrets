//jshint esversion:6
require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const findOrCreatePlugin = require('mongoose-findorcreate');


const app = express();

app.set(session({
    secret: "this is a secret key",
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");


mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    googleid: String,
    username: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:7000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v1/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ username: profile.emails[0].value,googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile","email"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.render("secrets");
  });

app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/register", (req, res) =>{
    res.render("register");
});

app.get("/logout", (req, res) => {
    res.redirect("/");
});

app.get("/submit", (req, res) => {
    res.render("submit");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        console.log(req.isAuthenticated());
        res.redirect("/login");
    }
});

app.post("/register", (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local", { failureRedirect: '/login' })(req, res, () => {
                res.render("secrets");
            })
        }
    })
});

app.post("/login", (req, res) => {
    user = new User({
        username: req.body.username,
        password: req.body.password,
    })
    req.login(user,(err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local", { failureRedirect: '/login' }) (req, res, () => {
                res.render("secrets");
            })
        }
    })
});

app.post("/submit", (req, res) => {
    
})



app.listen(7000, () => {
    console.log("Listening to port 7000.");
});