"use strict";
var spawn = require('child_process').spawn;
var server = require('./server');
const students = require('./students');
const grader = require("./Server/Autograder/AutoGrader");
const Future_1 = require("./Server/Autograder/Future");
const Result_1 = require("./Server/Autograder/Result");
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
app.post('/group/sendResults', function (req, res) {
    const data = req.body;
    const project = data.project;
    const group = data.group;
    const assignment = data.assignment;
    const result = req.session.bestResult[project];
    res.end();
    //check if assignment.project == project
    //check if assignment is in group
    //check if all students are in same group, and the group.id is equal to group
    //check if students did not hand in already (only if final)
    //hand in for main student, and hand in non final for others -- only if test passed
    //if passed for main student then redirect to result of assignment page
    //else show error on submit page
});
app.post('/group/file-upload', function (req, res) {
    let sess = req.session;
    console.log(sess.bestResult);
    let project = new Promise((resolve, reject) => {
        req.busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            if (fieldname == "project")
                resolve(val);
        });
    });
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        let filepath = __dirname + '/uploads/' + filename;
        let fstream = fs.createWriteStream(filepath);
        file.pipe(fstream);
        fstream.on('close', function () {
            //simpleio (mk one for n io and only use that one)
            let simpleio = (s) => new Future_1.Future((resolve, reject) => {
                let running = true;
                let py = spawn("python3", ['uploads/' + filename]);
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
            project.then((project) => {
                //remove file in both cases
                grader.gradeProject(project, simpleio, function (r) {
                    if (!sess.bestResult || typeof sess.bestResult == "undefined" || sess.bestResult == null)
                        sess.bestResult = {};
                    sess.bestResult[project] = getBest(r, sess.bestResult.project);
                    res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: (r instanceof Result_1.Fail) ? r.getFailed().toArray() : [] });
                }, (err) => res.json({ success: false, err: err }));
            }, () => console.log("the impossible happend"));
        });
    });
});
function getBest(r1, r2) {
    if (r2 instanceof Result_1.Result && r1.totalTests() != r2.totalTests())
        return null;
    else if (!(r2 instanceof Result_1.Result) || r1.totalSuccess() > r2.totalSuccess())
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
    socket.on("getOtherStudents", function (group) {
        let user = socket.request.session.passport.user.email;
        students.getStudentsInGroup({ email: { $ne: user } }, group, function (docs) {
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