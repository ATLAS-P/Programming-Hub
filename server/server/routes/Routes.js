"use strict";
const passport = require('passport');
const fs = require('fs');
const Projects_1 = require('../../autograder/Projects');
const Groups_1 = require('../../database/tables/Groups');
const Files_1 = require('../../database/tables/Files');
const Table_1 = require('../../database/Table');
const Future_1 = require('../../functional/Future');
const IOMap_1 = require('../../functional/IOMap');
const List_1 = require('../../functional/List');
const Render_1 = require('./Render');
//cleanups needed below
var Routes;
(function (Routes) {
    const INDEX = "/";
    const LOGOUT = INDEX + "logout";
    const AUTH = INDEX + "auth/google";
    const AUTH_CALLBACK = AUTH + "/callback";
    const GROUP = INDEX + "group";
    const GROUP_ANY = GROUP + "/*";
    const FILE = INDEX + "results/*";
    const FILE_UPLOAD = GROUP + "/file-upload";
    const SUBMIT_RESULTS = GROUP + "/sendResults";
    const PRIVACY = INDEX + "legal/privacy";
    const DATABASE = GROUP_ANY + "database";
    const FILES = DATABASE + "/files";
    const USERS = DATABASE + "/users";
    function addRoutes(app, root) {
        app.get(FILES, files);
        app.get(USERS, users);
        app.get(GROUP_ANY, group);
        app.get(INDEX, index);
        app.get(LOGOUT, logout);
        app.get(FILE, showResult);
        app.get(PRIVACY, showPrivacy);
        app.post(SUBMIT_RESULTS, submitResults);
        app.post(FILE_UPLOAD, fileUpload(app, root));
        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }));
        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));
    }
    Routes.addRoutes = addRoutes;
    function showPrivacy(req, res) {
        Render_1.Render.withUser(req, res, "privacy");
    }
    function logout(req, res) {
        req.session.destroy(function (err) {
            if (err)
                console.log(err);
            res.redirect('/');
        });
    }
    function index(req, res) {
        Render_1.Render.withUser(req, res, "hub");
    }
    function users(req, res) {
        const group = req.url.split("/")[2];
        Groups_1.Groups.instance.populateStudents(group, g => {
            const students = g.students;
            const admins = g.admins;
            if (admins.indexOf(req.user.id) >= 0)
                Render_1.Render.withUser(req, res, "users", { users: students });
            else
                Render_1.Render.error(req, res, "You have insufficient rights to view this page");
        }, error => Render_1.Render.error(req, res, error));
    }
    function files(req, res) {
        const group = req.url.split("/")[2];
        res.send(":p");
    }
    function showResult(req, res) {
        const assignment = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Files_1.Files.instance.getDeepAssignment(req.user.id, assignment, f => Render_1.Render.file(req, res, "file", f), e => res.send(e));
    }
    function group(req, res) {
        req.session.result = null;
        const group = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroupDetails(req.user.id, group, g => Render_1.Render.groupDetails(req, res, "group", g), e => res.send(e));
    }
    function submitResults(req, res) {
        const data = req.body;
        const date = new Date();
        date.setHours(date.getHours() - 1);
        //show error on hand in page not res.send new page
        Groups_1.Groups.instance.getAndPopulate({ _id: data.group }, true, true, g => {
            let group = g[0];
            let assignment = group.assignments.find(a => a._id == data.assignment);
            const sess = req.session;
            if (sess.result && assignment && assignment.project._id == data.project) {
                if (assignment.due > date) {
                    const result = sess.result[data.project];
                    if (result) {
                        let students = List_1.List.apply([]);
                        group.students.forEach(s => {
                            let ref = data[s._id];
                            if (ref)
                                students = students.add(s);
                        });
                        let studentIDs = students.map(s => s._id).toArray();
                        const handedIn = (s) => new Future_1.Future((res, rej) => {
                            Files_1.Files.instance.getAssignment(s._id, assignment._id, f => res(f.final), rej => res(false));
                        });
                        const traverse = IOMap_1.IOMap.traverse(students, IOMap_1.IOMap.apply);
                        const someoneHandedIn = IOMap_1.IOMap.ListHelper.foldLeft(traverse, (b, bi) => b || bi, false).run(handedIn);
                        someoneHandedIn.then(nogo => {
                            if (nogo)
                                res.send("This assignment was alreaday handed in by you or your parnters!");
                            else {
                                const time = new Date();
                                res.redirect("/result/" + assignment._id);
                                students.toArray().forEach(s => {
                                    //if non final exisits override it
                                    let file = Table_1.Tables.mkFile(s._id, assignment._id, time, studentIDs, result, s._id == req.user.id, data[s._id]);
                                    Files_1.Files.instance.create(file, () => { }, Table_1.Table.error);
                                });
                            }
                        }, r => res.send("Unexpected error during validation of hand-in request!"));
                    }
                    else
                        res.send("No result found for assignment: " + assignment.project.name);
                }
                else
                    res.send("The deadline has passed!");
            }
            else
                res.send("Illigal assignment!");
        }, Table_1.Table.error);
    }
    function fileUpload(app, root) {
        //cleanups required below
        return (req, res) => {
            const sess = req.session;
            const busboy = req.busboy;
            let project = new Future_1.Future((resolve, reject) => {
                busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                    if (fieldname == "project") {
                        resolve(val);
                    }
                });
            });
            busboy.on('file', function (fieldname, file, filename) {
                const newName = filename + (new Date()).getTime();
                let filepath = root + '/uploads/' + newName;
                let fstream = fs.createWriteStream(filepath);
                file.pipe(fstream);
                fstream.on('close', function () {
                    project.then((project) => {
                        Projects_1.Projects.gradeProject(project, newName, function (r) {
                            if (!sess.result || typeof sess.result == "undefined" || sess.result == null)
                                sess.result = {};
                            sess.result[project] = r;
                            Render_1.Render.results(app, "result", r.toJSONList().toArray(), html => {
                                res.json({ success: true, html: html });
                            }, fail => {
                                res.json({ success: false, err: fail.message });
                            });
                            fs.unlink(filepath);
                        }, (err) => {
                            res.json({ success: false, err: err });
                            fs.unlink(filepath);
                        });
                    }, () => console.log("the impossible happend"));
                });
            });
            req.pipe(busboy);
        };
    }
})(Routes = exports.Routes || (exports.Routes = {}));
//# sourceMappingURL=Routes.js.map