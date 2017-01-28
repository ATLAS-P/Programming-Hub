"use strict";
const passport = require('passport');
const Groups_1 = require('../../database/tables/Groups');
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
    let storage;
    function addRoutes(app, root, fileService) {
        app.get(INDEX, index);
        app.get(LOGOUT, logout);
        app.get(PRIVACY, showPrivacy);
        app.get(GROUP_ANY, group);
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
            Groups_1.Groups.getGroup(group).then(g => Render_1.Render.withUser(req, res, "group/overview", { group: g }), e => Render_1.Render.error(req, res, e.toString()));
    }
})(Routes = exports.Routes || (exports.Routes = {}));
