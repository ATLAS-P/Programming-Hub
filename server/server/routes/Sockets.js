"use strict";
const Render_1 = require('./Render');
const Groups_1 = require('../../database/tables/Groups');
const Files_1 = require('../../database/tables/Files');
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
                    Render_1.Render.groupsOverview(app, "groups", lg, data => sendGroups(true, data), err => sendGroups(false, err));
                }, e => sendGroups(false, e));
            }
        };
    }
    Sockets.getGroupsOverview = getGroupsOverview;
    function getOtherUsersIn(app, socket) {
        const sendUsers = (success, data) => emitHtml(socket, SEND_GROUP_USERS, success, data);
        return g => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id;
                Groups_1.Groups.instance.getStudents(g, lu => {
                    Render_1.Render.users(app, "userList", lu.filter(v => v._id != user), html => sendUsers(true, html), err => sendUsers(false, err));
                }, e => sendUsers(false, e));
            }
        };
    }
    Sockets.getOtherUsersIn = getOtherUsersIn;
    function getNonFinalFiles(app, socket) {
        const send = (success, data) => emitHtml(socket, SEND_NON_FINAL, success, data);
        return () => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id;
                Files_1.Files.instance.getNonFinalFor(user, fl => {
                    Render_1.Render.files(app, "nonFinal", fl, html => send(true, html), err => send(false, err));
                }, e => send(false, e));
            }
        };
    }
    Sockets.getNonFinalFiles = getNonFinalFiles;
    function handleNonFinal(app, socket) {
        return (accept, ass) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id;
                if (accept)
                    Files_1.Files.instance.mkFinal(user, ass);
                else
                    Files_1.Files.instance.removeNonFinal(user, ass);
            }
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
//# sourceMappingURL=Sockets.js.map