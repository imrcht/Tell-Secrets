//jshint esversion:6
require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

const userSchema = new mongoose.Schema({
    email: String,
    pwd: String,
    thought: String
});

const saltRounds = 10;


const User = new mongoose.model("User", userSchema);


app.get("/", (req, res) =>{
    res.render("home");
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

app.post("/register", (req, res) => {
    password = req.body.password;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        const newUser = new User({
            email: req.body.username,
            pwd: hash,
        });
        newUser.save((err) => {
            if (!err) {
                res.redirect("/login")
            } else {
                console.log(err);
            }
        });
    });
});

app.post("/login", (req, res) => {
    username = req.body.username;
    password = req.body.password;
    User.findOne({email: username}, (err, founduser) => {
        if (err) {
            console.log(err);
        } else {
            if (founduser) {
                bcrypt.compare(password, founduser.pwd, (err, result) => {
                    if (result == true) {
                        res.render("secrets");
                    } else {
                        console.log("password wrong");
                    }
                });
            } else {
                console.log("User not found");
            }
        }
    })
})

app.post("/submit", (req, res) => {
    
})



app.listen(7000, () => {
    console.log("Listening to port 7000.");
});