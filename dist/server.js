"use strict";
const path = require('path');
const stylus = require('stylus');
var passport = require('passport');
var googleLogin = require('passport-google-oauth2').Strategy;
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var busboy = require('connect-busboy');
var session = require("express-session");
const students = require("./students");
mongoose.connect("mongodb://ds033986.mlab.com:33986/autograder", { user: "rikmuld", pass: "atlaspass" }); //user pass
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connected to database");
});
var GOOGLE_CLIENT_ID = "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com"; //id
var GOOGLE_CLIENT_SECRET = "F7giEmz6HL9N2ZZ-1GVewAw7"; //secret;
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
passport.use(new googleLogin({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback: true
}, function (request, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
        if (profile._json.domain == "student.utwente.nl") {
            students.getUser(profile, function (err) {
                done(null, null);
            }, (s) => done(null, s));
        }
        else
            done(null, null);
    });
}));
const sessionMiddle = session({
    resave: false,
    saveUninitialized: true,
    secret: 'Pssssst, keep it a secret!'
});
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(busboy());
io.use(function (socket, next) {
    sessionMiddle(socket.request, socket.request.res, next);
});
app.use(sessionMiddle);
app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
    req.db = db;
    next();
});
exports.app = app;
exports.io = io;
require('./routes');
server.listen(3000);
//# sourceMappingURL=server.js.map