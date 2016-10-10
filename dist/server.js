"use strict";
const path = require('path');
const stylus = require('stylus');
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var busboy = require('connect-busboy');
mongoose.connect("mongodb://ds033986.mlab.com:33986/autograder", { user: "rikmuld", pass: "atlaspass" });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("Connected to database");
});
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(busboy());
app.use(function (req, res, next) {
    req.db = db;
    next();
});
exports.app = app;
exports.io = io;
require('./routes');
server.listen(3000);
//# sourceMappingURL=server.js.map