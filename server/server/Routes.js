"use strict";
const passport = require('passport');
const fs = require('fs');
const grader = require('../autograder/AutoGrader');
const Groups_1 = require('../database/tables/Groups');
const Files_1 = require('../database/tables/Files');
const Table_1 = require('../database/Table');
const Future_1 = require('../functional/Future');
const List_1 = require('../functional/List');
const Result_1 = require('../autograder/Result');
const IOMap_1 = require('../functional/IOMap');
//split up in more files
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
    function addRoutes(app, root) {
        app.get(GROUP_ANY, group);
        app.get(INDEX, index);
        app.get(LOGOUT, logout);
        app.get(FILE, showResult);
        app.get(PRIVACY, showPrivacy);
        app.post(SUBMIT_RESULTS, submitResults);
        app.post(FILE_UPLOAD, fileUpload(root));
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
        Render.withUser(req, res, "privacy");
    }
    function logout(req, res) {
        req.session.destroy(function (err) {
            if (err)
                console.log(err);
            res.redirect('/');
        });
    }
    function index(req, res) {
        Render.withUser(req, res, "hub");
    }
    function showResult(req, res) {
        const assignment = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Files_1.Files.instance.getDeepAssignment(req.user.id, assignment, f => Render.file(req, res, "file", f), e => res.send(e));
    }
    function group(req, res) {
        req.session.bestResult = null;
        const group = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroupDetails(req.user.id, group, g => Render.groupDetails(req, res, "group", g), e => res.send(e));
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
            if (sess.bestResult && assignment && assignment.project._id == data.project) {
                if (assignment.due > date) {
                    const result = bestResult[data.project];
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
    function fileUpload(root) {
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
                let filepath = root + '/uploads/' + filename;
                let fstream = fs.createWriteStream(filepath);
                file.pipe(fstream);
                fstream.on('close', function () {
                    project.then((project) => {
                        grader.gradeProject(project, filename, function (r) {
                            if (!sess.bestResult || typeof sess.bestResult == "undefined" || sess.bestResult == null)
                                sess.bestResult = {};
                            sess.bestResult[project] = r.best(sess.bestResult[project]);
                            res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: (r instanceof Result_1.Fail) ? r.getFailed().toArray() : [] });
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
var Sockets;
(function (Sockets) {
    //on or get is for receiving, others can be used to emit
    const ON_CONNECTION = "connection";
    const GET_GROUPS = "getGroups";
    const GET_GROUP_USERS = "getUsersIn";
    const GET_NON_FINAL = "getNonFinalHandIns";
    const ON_HANDLE_NON_FINAL = "handleNonFinal";
    const SEND_GROUPS = "setGroups";
    const SEND_GROUP_USERS = "setUsersIn";
    const SEND_NON_FINAL = "setNonFinalHandIns";
    function bindHandlers(app, io) {
        console.log("setting op io");
        io.on(ON_CONNECTION, connection(app));
    }
    Sockets.bindHandlers = bindHandlers;
    function connection(app) {
        return socket => {
            console.log("socket connected");
            socket.on(GET_GROUPS, getGroupsOverview(app, socket));
            socket.on(GET_GROUP_USERS, getOtherUsersIn(app, socket));
            socket.on(GET_NON_FINAL, getNonFinalFiles(app, socket));
            socket.on(ON_HANDLE_NON_FINAL, handleNonFinal(app, socket));
        };
    }
    Sockets.connection = connection;
    //three below share too much, generalize
    function getGroupsOverview(app, socket) {
        const sendGroups = (success, data) => emitHtml(socket, SEND_GROUPS, success, data);
        return () => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id;
                Groups_1.Groups.getOverviewForUser(user, lg => {
                    Render.groupsOverview(app, "groups", lg, data => sendGroups(true, data), err => sendGroups(false, err));
                }, e => sendGroups(false, e));
            }
        };
    }
    Sockets.getGroupsOverview = getGroupsOverview;
    function getOtherUsersIn(app, socket) {
        const sendUsers = (success, data) => emitHtml(socket, SEND_GROUP_USERS, success, data);
        return g => {
            const user = socket.request.session.passport.user.id;
            Groups_1.Groups.instance.getStudents(g, lu => {
                Render.users(app, "userList", lu.filter(v => v._id != user), html => sendUsers(true, html), err => sendUsers(false, err));
            }, e => sendUsers(false, e));
        };
    }
    Sockets.getOtherUsersIn = getOtherUsersIn;
    function getNonFinalFiles(app, socket) {
        const send = (success, data) => emitHtml(socket, SEND_NON_FINAL, success, data);
        return () => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id;
                Files_1.Files.instance.getNonFinalFor(user, fl => {
                    Render.files(app, "nonFinal", fl, html => send(true, html), err => send(false, err));
                }, e => send(false, e));
            }
        };
    }
    Sockets.getNonFinalFiles = getNonFinalFiles;
    function handleNonFinal(app, socket) {
        return (accept, ass) => {
            const user = socket.request.session.passport.user.id;
            if (accept)
                Files_1.Files.instance.mkFinal(user, ass);
            else
                Files_1.Files.instance.removeNonFinal(user, ass);
        };
    }
    Sockets.handleNonFinal = handleNonFinal;
    function emitHtml(socket, to, success, data) {
        if (success)
            socket.emit(to, { success: true, html: data });
        else
            socket.emit(to, { success: false, err: (data instanceof Error ? data.message : data) });
    }
    Sockets.emitHtml = emitHtml;
})(Sockets = exports.Sockets || (exports.Sockets = {}));
var Render;
(function (Render) {
    function withUser(req, res, loc) {
        res.render(loc, {
            user: req.user
        });
    }
    Render.withUser = withUser;
    function groupDetails(req, res, loc, data) {
        res.render(loc, {
            user: req.user,
            a_open: data.openAssignments,
            a_close: data.closedAssignments,
            a_done: data.doneAssignments,
            group: {
                id: data.id,
                name: data.name
            }
        });
    }
    Render.groupDetails = groupDetails;
    function file(req, res, loc, data) {
        res.render(loc, {
            user: req.user,
            file: data
        });
    }
    Render.file = file;
    function groupsOverview(app, loc, data, success, fail) {
        render(app, loc, {
            groups: data
        }, success, fail);
    }
    Render.groupsOverview = groupsOverview;
    function users(app, loc, data, success, fail) {
        render(app, loc, {
            users: data
        }, success, fail);
    }
    Render.users = users;
    function files(app, loc, data, success, fail) {
        render(app, loc, {
            files: data
        }, success, fail);
    }
    Render.files = files;
    function render(app, loc, data, success, fail) {
        app.render(loc, data, (err, suc) => {
            if (err)
                fail(err);
            else
                success(suc);
        });
    }
    Render.render = render;
})(Render = exports.Render || (exports.Render = {}));
//# sourceMappingURL=Routes.js.map