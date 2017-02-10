"use strict";
const Groups_1 = require('../../database/tables/Groups');
const Users_1 = require('../../database/tables/Users');
const Assignments_1 = require('../../database/tables/Assignments');
const MkTables_1 = require('../../database/MkTables');
const Future_1 = require('../../functional/Future');
const List_1 = require('../../functional/List');
const IOMap_1 = require('../../functional/IOMap');
const Tuple_1 = require('../../functional/Tuple');
const Files_1 = require('../../database/tables/Files');
const azure = require('azure-storage');
var Sockets;
(function (Sockets) {
    const ON_CONNECTION = "connection";
    const ON_CREATE_COURSE = "createCourse";
    const ON_REMOVE_COURSE = "removeCourse";
    const ON_CREATE_ASSIGNMENT = "createAssignment";
    const ON_UPDATE_ASSIGNMENT = "updateAssignment";
    const ON_REMOVE_ASSIGNMENT = "removeAssignment";
    const ON_GET_USERS = "getUsers";
    const ON_ADD_USERS = "addUsers";
    const ON_UPLOAD_FILES = "uploadFiles";
    const ON_FEEDBACK = "updateFeedback";
    const ON_SET_FINAL = "manageFinal";
    const ON_UPDATE_COURSE = "updateCourse";
    const RESULT_CREATE_COURSE = "courseCreated";
    const RESULT_CREATE_ASSIGNMENT = "assignmentCreated";
    const RESULT_REMOVE_COURSE = "courseRemoved";
    const RESULT_REMOVE_ASSIGNMENT = "assignmentRemoved";
    const RESULT_UPDATE_ASSIGNMENT = "assignmentUpdated";
    const RESULT_GET_USERS = "usersGot";
    const RESULT_ADD_USERS = "usersAdded";
    const RESULT_UPLOAD_FILES = "fileUplaoded";
    const RESULT_FEEDBACK = "feedbacked";
    const RESULT_FINAL = "doneFinal";
    const RESULT_UPDATE_COURSE = "courseUpdated";
    function bindHandlers(app, io, storage) {
        io.on(ON_CONNECTION, connection(app, storage));
    }
    Sockets.bindHandlers = bindHandlers;
    function connection(app, storage) {
        return socket => {
            socket.on(ON_CREATE_COURSE, createCourse(app, socket));
            socket.on(ON_REMOVE_COURSE, removeCourse(app, socket));
            socket.on(ON_UPDATE_COURSE, updateCourse(app, socket));
            socket.on(ON_CREATE_ASSIGNMENT, createAssignment(app, socket));
            socket.on(ON_REMOVE_ASSIGNMENT, removeAssignment(app, socket));
            socket.on(ON_UPDATE_ASSIGNMENT, updateAssignment(app, socket));
            socket.on(ON_GET_USERS, getUsers(app, socket));
            socket.on(ON_ADD_USERS, addUsers(app, socket));
            socket.on(ON_UPLOAD_FILES, uploadFile(app, socket, storage));
            socket.on(ON_FEEDBACK, updateFeedback(app, socket));
            socket.on(ON_SET_FINAL, manageFinal(app, socket));
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
    function updateCourse(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_UPDATE_COURSE, success, error && error.message ? error.message : error);
        return (course, name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.updateOne(course, g => {
                        g.name = name;
                        g.start = start;
                        g.end = end;
                    }).then(g => emitResult(true), e => emitResult(false, e));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.updateCourse = updateCourse;
    function updateAssignment(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_UPDATE_ASSIGNMENT, success, error && error.message ? error.message : error);
        return (group, ass, name, type, due, link) => {
            console.log(group, ass, name, type, due, link);
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.isAdmin(group, user.id).flatMap(isAdmin => {
                        if (isAdmin) {
                            return Assignments_1.Assignments.instance.updateOne(ass, a => {
                                if (type == a.typ) {
                                    a.name = name;
                                    a.due = due;
                                    a.link = link;
                                }
                            }).flatMap(a => {
                                if (a.typ == type)
                                    return Future_1.Future.unit(a);
                                else
                                    return Future_1.Future.reject("You cannot change the type of an assignment!");
                            });
                        }
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
    Sockets.updateAssignment = updateAssignment;
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
    function updateFeedback(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_FEEDBACK, success, error && error.message ? error.message : error);
        return (file, feedback) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Files_1.Files.instance.updateFeedback(file, feedback).then(f => emitResult(true), e => emitResult(false, e));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.updateFeedback = updateFeedback;
    function addUsers(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_ADD_USERS, success, error);
        return (group, users, role) => {
            console.log(group, users, role);
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                if (user.admin) {
                    Groups_1.Groups.instance.addUsers(group, users, role == "admin").then(g => emitResult(true), e => emitResult(false, e));
                }
                else
                    emitResult(false, "You have insufficent rights to perform this action.");
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.addUsers = addUsers;
    function manageFinal(app, socket) {
        const emitResult = (success, error) => socket.emit(RESULT_FINAL, success, error);
        return (accept, group, file) => {
            console.log(accept, group, file);
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user;
                Users_1.Users.instance.updateOne(user.id, u => {
                    const files = u.groups.find(g => g.group == group).files;
                    const fileInst = files.find(f => f.file == file);
                    if (accept)
                        fileInst.final = true;
                    else
                        files.splice(files.indexOf(fileInst), 1);
                }).then(u => {
                    if (accept)
                        emitResult(true);
                    else
                        Files_1.Files.instance.updateOne(file, f => {
                            const students = f.students;
                            const userIndex = students.indexOf(u._id);
                            students.splice(userIndex, 1);
                        }).then(f => emitResult(true), e => emitResult(false, e));
                }, e => emitResult(false, e));
            }
            else
                emitResult(false, "The session was lost, please login again.");
        };
    }
    Sockets.manageFinal = manageFinal;
    function uploadFile(app, socket, storage) {
        const emitResult = (success, error) => socket.emit(RESULT_UPLOAD_FILES, success, error);
        return (assignment, handInName, comments, students, files) => {
            console.log(assignment, handInName, comments, students, files);
            if (socket.request.session.passport) {
                let groupId = "";
                const user = socket.request.session.passport.user;
                students.push(user.id);
                const properHandin = Assignments_1.Assignments.instance.exec(Assignments_1.Assignments.instance.populateFiles(Assignments_1.Assignments.instance.getByID(assignment))).flatMap(ass => Groups_1.Groups.instance.exec(Groups_1.Groups.instance.getByID(ass.group)).map(g => new Tuple_1.Tuple(ass, g))).flatMap(data => {
                    groupId = data._2._id;
                    for (let s in students)
                        if (data._2.students.indexOf(s) >= 0)
                            return Future_1.Future.reject("Student: '" + s + "' is not part of the course!");
                    if (data._1.typ == "open")
                        return Future_1.Future.unit(true);
                    else {
                        for (let file of data._1.files) {
                            for (let s of students)
                                if (file.students.find(st => st._id == s))
                                    return Future_1.Future.reject("Student: '" + s + "' already handed in this file!");
                        }
                        return Future_1.Future.unit(true);
                    }
                });
                const upload = (success) => {
                    if (!success)
                        emitResult(false, "We were not able to validate your hand-in!");
                    else {
                        const root = "https://atlasprogramming.file.core.windows.net/handins/";
                        const pending = root + "pending/" + user.id + "/" + assignment + "/";
                        Files_1.Files.instance.create(MkTables_1.MkTables.mkFile(assignment, handInName, students, [], comments)).then(file => {
                            const id = file._id;
                            storage.createDirectoryIfNotExists('handins', "files", (error, resu, response) => {
                                storage.createDirectoryIfNotExists('handins', "files/" + id, (error, resu, response) => {
                                    const fileToLink = (fileName) => new Future_1.Future((res, rej) => {
                                        storage.startCopyFile(pending + fileName, "handins", "files/" + id, fileName, (error, resu, response) => {
                                            if (error)
                                                rej(error.message);
                                            else
                                                res(root + "files/" + id + "/" + fileName + "?" + storage.generateSharedAccessSignature("handins", "files/" + id, fileName, {
                                                    AccessPolicy: {
                                                        Permissions: "r",
                                                        Expiry: azure.date.daysFromNow(1000)
                                                    }
                                                }));
                                        });
                                    });
                                    IOMap_1.IOMap.traverse(List_1.List.apply(files), IOMap_1.IOMap.apply).run(fileToLink).flatMap(links => {
                                        file.urls = links.toArray();
                                        return file.save();
                                    }).flatMap(file => Users_1.Users.instance.makeFinal(user.id, groupId, file._id)).then(() => emitResult(true), e => emitResult(false, e));
                                });
                            });
                        }, e => emitResult(false, e));
                    }
                };
                properHandin.then(upload, (err) => emitResult(false, err));
            }
        };
    }
    Sockets.uploadFile = uploadFile;
})(Sockets = exports.Sockets || (exports.Sockets = {}));
