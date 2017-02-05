"use strict";
const passport = require('passport');
const fs = require('fs');
const Groups_1 = require('../../database/tables/Groups');
const Files_1 = require('../../database/tables/Files');
const Assignments_1 = require('../../database/tables/Assignments');
const Future_1 = require('../../functional/Future');
const Render_1 = require('./Render');
var Routes;
(function (Routes) {
    const INDEX = "/";
    const LOGOUT = INDEX + "logout";
    const PRIVACY = INDEX + "legal/privacy";
    const AUTH = INDEX + "auth/google";
    const AUTH_CALLBACK = AUTH + "/callback";
    const GROUP = INDEX + "group";
    const GROUP_ANY = GROUP + "/*";
    const GROUP_USER = GROUP_ANY + "/user/*";
    const GROUP_ASSIGNMENT = GROUP_ANY + "/assignment/*";
    const FILE = INDEX + "file";
    const FILE_ANY = FILE + "/*";
    const FILE_UPLOAD = GROUP + "/file-upload";
    let storage;
    function addRoutes(app, root, fileService) {
        app.get(INDEX, index);
        app.get(LOGOUT, logout);
        app.get(PRIVACY, showPrivacy);
        app.get(GROUP_ASSIGNMENT, assignment);
        app.get(GROUP_USER, user);
        app.get(GROUP_ANY, group);
        app.get(FILE_ANY, file);
        app.post(FILE_UPLOAD, fileUpload(app, root));
        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }));
        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }));
        storage = fileService;
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
        if (req.user)
            Groups_1.Groups.getGroups(req.user.id).then(lg => Render_1.Render.withUser(req, res, "hub", { groups: lg }), e => Render_1.Render.error(req, res, e.toString()));
        else
            Render_1.Render.withUser(req, res, "hub");
    }
    function group(req, res) {
        const group = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroup(group).then(g => {
                Files_1.Files.forStudentInGroup(req.user.id, group).then(user => Render_1.Render.withUser(req, res, "group/overview", { group: g, fullUser: user }), e => Render_1.Render.error(req, res, e.toString()));
            }, e => Render_1.Render.error(req, res, e.toString()));
    }
    function user(req, res) {
        const group = req.url.split("/")[2];
        const usr = req.url.split("/")[4];
        if (!req.user)
            res.redirect("/");
        else
            Groups_1.Groups.getGroup(group).flatMap(g => Files_1.Files.forStudentInGroup2(usr, group).map(f => [g, f])).then(data => Render_1.Render.withUser(req, res, "group/overviews/user", { files: data[1][0], group: data[0], student: data[1][1] }), err => Render_1.Render.error(req, res, err));
    }
    function assignment(req, res) {
        const assignment = req.url.split("/")[4];
        if (!req.user)
            res.redirect("/");
        else
            Assignments_1.Assignments.instance.exec(Files_1.Files.forAssignment(assignment)).then(ass => Render_1.Render.withUser(req, res, "group/overviews/assignment", { assignment: ass }), err => Render_1.Render.error(req, res, err));
    }
    function file(req, res) {
        const file = req.url.split("/")[2];
        if (!req.user)
            res.redirect("/");
        else
            Files_1.Files.instance.exec(Files_1.Files.instance.populateAll(Files_1.Files.instance.getByID(file))).then(file => {
                Render_1.Render.withUser(req, res, "group/file", { file: file });
            }, e => Render_1.Render.error(req, res, e.toString()));
    }
    function fileUpload(app, root) {
        return (req, res) => {
            const busboy = req.busboy;
            const data = new Future_1.Future((res, rej) => busboy.on('field', (name, val, nameTrunc, valTrunc, enc, type) => res(val)));
            busboy.on('file', function (fieldname, file, filename) {
                const filepath = root + '/uploads/' + filename + "_" + req.user.id;
                const fstream = fs.createWriteStream(filepath);
                function upload(assignment, success) {
                    storage.createDirectoryIfNotExists('handins', "pending", (error, result, response) => {
                        storage.createDirectoryIfNotExists('handins', "pending" + "/" + req.user.id, (error, result, response) => {
                            storage.createDirectoryIfNotExists('handins', "pending" + "/" + req.user.id + "/" + assignment, (error, result, response) => {
                                storage.createFileFromLocalFile('handins', "pending" + "/" + req.user.id + "/" + assignment, filename, filepath, (error, result, response) => {
                                    if (error)
                                        res.json({ success: false, err: error.message });
                                    else
                                        success();
                                    fs.unlink(filepath);
                                });
                            });
                        });
                    });
                }
                file.pipe(fstream);
                fstream.on('close', () => data.then(assignment => upload(assignment, () => res.json({ success: true }))));
            });
            req.pipe(busboy);
        };
    }
})(Routes = exports.Routes || (exports.Routes = {}));
