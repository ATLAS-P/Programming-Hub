import path = require('path')
import stylus = require('stylus')

var passport = require('passport')
var googleLogin = require('passport-google-oauth').Strategy;
var express = require('express')
var mongoose = require('mongoose')
var bodyParser = require('body-parser')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var busboy = require('connect-busboy');

mongoose.connect("mongodb://ds033986.mlab.com:33986/autograder", { user: "", pass: "" })//user pass
var db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connected to database")
});

var GOOGLE_CLIENT_ID = ""//id
var GOOGLE_CLIENT_SECRET = ""//secret;

passport.serializeUser(function (user, done) {
    done(null, user); //chnge to user id from database
});

passport.deserializeUser(function (obj, done) {
    done(null, obj); //chnge to user id from database
});

passport.use(new googleLogin({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        //NOTE :
        //Carefull ! and avoid usage of Private IP, otherwise you will get the device_id device_name issue for Private IP during authentication
        //The workaround is to set up thru the google cloud console a fully qualified domain name such as http://mydomain:3000/ 
        //then edit your /etc/hosts local file to point on your private IP. 
        //Also both sign-in button + callbackURL has to be share the same url, otherwise two cookies will be created and lead to lost your session
        //if you use it.
        callbackURL: "http://localhost:3000/auth/google/callback",
        passReqToCallback: true
    }, function (request, accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
      
            // To keep the example simple, the user's Google profile is returned to
            // represent the logged-in user.  In a typical application, you would want
            // to associate the Google account with a user record in your database,
            // and return that user instead.
            return done(null, profile);
        });
    }
));

app.set('view engine', 'jade')
app.set('views', path.join(__dirname, 'views'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(stylus.middleware(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(busboy());

app.use(session({
    secret: 'cookie_secret',
    name: 'kaas',
    store: new RedisStore({
        host: '127.0.0.1',
        port: 6379
    }),
    proxy: true,
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
    req.db = db
    next()
})

exports.app = app
exports.io = io

require('./routes')

server.listen(3000)