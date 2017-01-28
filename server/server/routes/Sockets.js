"use strict";
const Groups_1 = require('../../database/tables/Groups');
const Users_1 = require('../../database/tables/Users');
const Assignments_1 = require('../../database/tables/Assignments');
const MkTables_1 = require('../../database/MkTables');
const Future_1 = require('../../functional/Future');
var Sockets;
(function (Sockets) {
    const ON_CONNECTION = "connection";
    const ON_CREATE_COURSE = "createCourse";
    const ON_REMOVE_COURSE = "removeCourse";
    const ON_CREATE_ASSIGNMENT = "createAssignment";
    const ON_REMOVE_ASSIGNMENT = "removeAssignment";
    const ON_GET_USERS = "getUsers";
    const ON_ADD_USERS = "addUsers";
    const RESULT_CREATE_COURSE = "courseCreated";
    const RESULT_CREATE_ASSIGNMENT = "assignmentCreated";
    const RESULT_REMOVE_COURSE = "courseRemoved";
    const RESULT_REMOVE_ASSIGNMENT = "assignmentRemoved";
    const RESULT_GET_USERS = "usersGot";
    const RESULT_ADD_USERS = "usersAdded";
    function bindHandlers(app, io) {
        io.on(ON_CONNECTION, connection(app));
    }
    Sockets.bindHandlers = bindHandlers;
    function connection(app) {
        return socket => {
            socket.on(ON_CREATE_COURSE, createCourse(app, socket));
            socket.on(ON_REMOVE_COURSE, removeCourse(app, socket));
            socket.on(ON_CREATE_ASSIGNMENT, createAssignment(app, socket));
            socket.on(ON_REMOVE_ASSIGNMENT, removeAssignment(app, socket));
            socket.on(ON_GET_USERS, getUsers(app, socket));
            socket.on(ON_ADD_USERS, addUsers(app, socket));
        };
    }
    Sockets.connection = connection;
    function createCourse(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_CREATE_COURSE, success, error && error.message ? error.message : error);
        return (name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.create(MkTables_1.MkTables.mkGroup(name, start, end)).flatMap(g => Groups_1.Groups.instance.addUser(g._id, user.id, true, true)).then(g => emitResult(true), e => emitResult(false, e));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.createCourse = createCourse;
    function createAssignment(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_CREATE_ASSIGNMENT, success, error && error.message ? error.message : error);
        return (group, name, type, due, link) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.isAdmin(group, user.id).flatMap(isAdmin => {
                        if (isAdmin)
                            return Groups_1.Groups.instance.mkAndAddAssignment(group, MkTables_1.MkTables.mkAssignment(name, group, due, type, link));
                        else
                            return Future_1.Future.reject("You have insufficent rights to perform this action.");
                    }).then(a => emitResult(true), e => emitResult(false, e));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.createAssignment = createAssignment;
    function removeCourse(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_REMOVE_COURSE, success, error && error.message ? error.message : error);
        return (course) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.isAdmin(course, user.id).flatMap(isAdmin => {
                        if (isAdmin)
                            return Groups_1.Groups.removeGroup(course);
                        else
                            Future_1.Future.reject("You have insufficent rights to perform this action.");
                    }).then(v => emitResult(true), errors => emitResult(false, errors));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.removeCourse = removeCourse;
    function removeAssignment(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_REMOVE_ASSIGNMENT, success, error && error.message ? error.message : error);
        return (assignment) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Assignments_1.Assignments.instance.removeAssignment(assignment, true).then(v => emitResult(true), errors => emitResult(false, errors));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.removeAssignment = removeAssignment;
    function getUsers(app, socket) {
        const emitResult = (users) => socket.emit(RESULT_GET_USERS, users);
        return (usersNot) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Users_1.Users.instance.exec(Users_1.Users.instance.model.find({ "_id": { $nin: usersNot } }).sort({ "name": 1, "surename": 1 }).select("-groups"), false).then(users => {
                        emitResult(users), e => console.log(e);
                    });
                }
            }
        };
    }
    Sockets.getUsers = getUsers;
    function addUsers(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_ADD_USERS, success, error);
        return (users, group, role) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.addUsers(group, users, role == "admin").then(g => emitResult(true), e => emitResult(false, e));
                }
            }
        };
    }
    Sockets.addUsers = addUsers;
})(Sockets = exports.Sockets || (exports.Sockets = {}));
