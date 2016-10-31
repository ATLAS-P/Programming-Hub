"use strict";
const Users_1 = require('../database/tables/Users');
const Config_1 = require('./Config');
const express = require("express");
const path = require('path');
const stylus = require('stylus');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
//no typings available for this one :(
const authGoogle = require('passport-google-oauth2');
const busboy = require('connect-busboy');
var Setup;
(function (Setup) {
    function startServer(server) {
        server.listen(3000);
    }
    Setup.startServer = startServer;
    function setupExpress(app, root) {
        const viewsDir = path.join(root, 'views');
        const publicDir = path.join(root, 'public');
        app.set('view engine', 'jade');
        app.set('views', viewsDir);
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(stylus.middleware(publicDir));
        app.use(express.static(publicDir));
        app.use(busboy());
    }
    Setup.setupExpress = setupExpress;
    function setupSession(app, io) {
        const sessionMiddle = session({
            resave: false,
            saveUninitialized: true,
            secret: 'Pssssst, keep it a secret!'
        });
        io.use((socket, next) => sessionMiddle(socket.request, socket.request.res, next));
        app.use(sessionMiddle);
    }
    Setup.setupSession = setupSession;
    function setupDatabase(address, port, database, user, password) {
        mongoose.connect("mongodb://" + address + ":" + port + "/" + database, { user: user, pass: password });
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function (callback) {
            console.log("Connected to database");
        });
        return db;
    }
    Setup.setupDatabase = setupDatabase;
    function setupAuthGoogle(googleID, googleSecret) {
        const googleLogin = {
            clientID: googleID,
            clientSecret: googleSecret,
            callbackURL: "http://" + Config_1.Config.auth.callback + "/auth/google/callback",
            passReqToCallback: true
        };
        const handleLogin = (request, accessToken, refreshToken, profile, done) => {
            process.nextTick(() => {
                if (profile._json.domain == "student.utwente.nl") {
                    Users_1.Users.getByGProfile(profile, u => done(null, Users_1.Users.simplify(u)), e => done(null, null));
                }
                else
                    done(null, null);
            });
        };
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((user, done) => done(null, user));
        passport.use(new authGoogle.Strategy(googleLogin, handleLogin));
    }
    Setup.setupAuthGoogle = setupAuthGoogle;
    function addAuthMiddleware(app) {
        app.use(passport.initialize());
        app.use(passport.session());
    }
    Setup.addAuthMiddleware = addAuthMiddleware;
    function addAsMiddleware(app, name, data) {
        app.use((req, res, next) => {
            req[name] = data;
            next();
        });
    }
    Setup.addAsMiddleware = addAsMiddleware;
})(Setup = exports.Setup || (exports.Setup = {}));
//# sourceMappingURL=Setup.js.map