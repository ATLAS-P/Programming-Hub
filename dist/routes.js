"use strict";
var spawn = require('child_process').spawn;
var server = require('./server');
const grader = require("./Autograder");
const students = require('./students');
var fs = require('fs');
var app = server.app;
var io = server.io;
var passport = require('passport');
app.get('/group/*', function (req, res) {
    req.session.bestResult = null;
    let group = req.url.split("/")[2];
    students.collectAssignments(group, (asso, assc, g) => res.render('group', { assignmentso: asso, assignmentsc: assc, group: g, user: req.user }), (err) => res.send(err));
});
app.get('/result', function (req, res) {
    res.render('result', { success: true, tests: 10, pass: 10, failed: [1, 2, 3, 4] });
});
app.get('/', function (req, res) {
    res.render('grader', { user: req.user, });
});
//cleanup below
app.post('/group/file-upload', function (req, res) {
    let sess = req.session;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        let filepath = __dirname + '/uploads/' + filename;
        let fstream = fs.createWriteStream(filepath);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Upload Finished of " + filename);
            //simple io
            let simpleio = (s) => new Promise((resolve, reject) => {
                let running = true;
                let py = spawn("python", ['uploads/' + filename]);
                let output = [];
                py.stdout.on('data', function (data) {
                    var buff = new Buffer(data);
                    output.push(buff.toString("utf8"));
                });
                py.stderr.on('data', function (err) {
                    var buff = new Buffer(err);
                    reject(buff.toString("utf8"));
                });
                py.on('close', function () {
                    running = false;
                    if (output.length == 0)
                        reject("No output received!");
                    else {
                        resolve(output[0].replace(/\r?\n|\r/, ""));
                    }
                });
                py.stdin.write(s);
                py.stdin.end();
                setTimeout(function () {
                    if (running) {
                        py.kill();
                        reject("Max runtime of 10s exeeded!");
                    }
                }, 10000);
            });
            grader.gradeIOEcho(simpleio, function (r) {
                req.session.bestResult = getBest(r, req.session.bestResult); //set best result together with assignmenet ID, so it will definitely be submited for the right assignmnet
                res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: (r instanceof grader.Fail) ? r.getFailed() : [] });
            }, (err) => res.json({ success: false, err: err }));
        });
    });
});
function getBest(r1, r2) {
    if (r2 instanceof grader.Result && r1.totalTests() != r2.totalTests())
        return null;
    else if (!(r2 instanceof grader.Result) || r1.totalSuccess() > r2.totalSuccess())
        return r1;
    else
        return r2;
}
app.get('/auth/google', passport.authenticate('google', {
    scope: [
        'https://www.googleapis.com/auth/plus.login',
        'https://www.googleapis.com/auth/plus.profile.emails.read']
}));
app.get('/auth/google/callback', passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/'
}));
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});
io.on('connection', function (socket) {
    socket.on('getMiniprojects', function () {
        if (socket.request.session.passport) {
            students.getSimpleGroups(socket.request.session.passport.user.email, function (projects) {
                app.render("miniprojects", { groups: projects }, function (err, html) {
                    if (err)
                        socket.emit('setMiniprojects', { success: false, err: err.toString() });
                    else
                        socket.emit('setMiniprojects', { success: true, html: html });
                }), (err) => socket.emit('setMiniprojects', { success: false, err: err });
            }, (err) => console.log(err));
        }
    });
    socket.on("sendResult", function (project, group, student_reflection) {
        let result = socket.request.session.bestResult; //index with project id and then find with project parameter.
        //create a Task for every student with the reflection and project
        //send tasks to database
        //send socket back to redirect to group main page
    });
    socket.on("getOtherStudents", function (group) {
        let user = socket.request.session.passport.user.email;
        students.getStudentsInGroup({ email: { $ne: user } }, group, function (docs) {
            console.log(docs);
            app.render("partners", { students: docs }, function (err, html) {
                if (err)
                    socket.emit('setPartners', { success: false, err: err.toString() });
                else
                    socket.emit('setPartners', { success: true, html: html });
            });
        }, (err) => console.log(err));
    });
});
//# sourceMappingURL=routes.js.map