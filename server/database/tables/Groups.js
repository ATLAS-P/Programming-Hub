"use strict";
const Table_1 = require('../Table');
const Users_1 = require('./Users');
const Assignments_1 = require('./Assignments');
const List_1 = require('../../functional/List');
const Tuple_1 = require('../../functional/Tuple');
const Future_1 = require('../../functional/Future');
const IOMap_1 = require('../../functional/IOMap');
class Group extends Table_1.Table {
    create(g) {
        return super.create(g).flatMap(group => {
            const addToGroup = (s) => Future_1.Future.lift(Users_1.Users.instance.addToGroup(s, group._id, false, false).then(user => List_1.List.mk(), (err) => List_1.List.mk(err)));
            const users = List_1.List.apply(group.students).append(List_1.List.apply(group.admins));
            const error = IOMap_1.IOMap.traverse(users, IOMap_1.IOMap.apply).run(addToGroup).map(s => List_1.List.concat(s));
            return error.flatMap(errors => {
                if (errors.length() == 0)
                    return Future_1.Future.unit(group);
                else
                    return Future_1.Future.reject(new Tuple_1.Tuple(group, errors));
            });
        });
    }
    addUser(g, s, admin, updateStudent) {
        return this.updateOne(g, (a) => {
            if (admin)
                if (a.admins.indexOf(s) == -1)
                    a.admins.push(s);
                else if (a.students.indexOf(s) == -1)
                    a.students.push(s);
        }).flatMap(a => {
            if (updateStudent)
                return Users_1.Users.instance.addToGroup(s, g, admin, false).map(u => a);
            else
                return Future_1.Future.unit(a);
        });
    }
    addUsers(g, users, admin) {
        const addToGroup = (s) => Future_1.Future.lift(Users_1.Users.instance.addToGroup(s, g, false, false).then(user => List_1.List.mk(), (err) => List_1.List.mk(err)));
        const error = IOMap_1.IOMap.traverse(List_1.List.apply(users), IOMap_1.IOMap.apply).run(addToGroup).map(s => List_1.List.concat(s));
        return this.updateOne(g, group => {
            users.forEach(u => {
                const coll = admin ? group.admins : group.students;
                if (coll.indexOf(u) == -1)
                    coll.push(u);
            });
        }).flatMap(group => error.flatMap(e => {
            if (e.length() == 0)
                return Future_1.Future.unit(group);
            else
                return Future_1.Future.reject(e.foldLeft('', (acc, next) => acc + next + ""));
        }));
    }
    removeUser(g, s, admin, updateStudent) {
        return this.updateOne(g, (a) => {
            const collection = (admin ? a.admins : a.students);
            const index = collection.indexOf(s);
            if (index >= 0)
                collection.splice(index, 1);
        }).flatMap(a => {
            if (updateStudent)
                return Users_1.Users.instance.removeFromGroup(s, g, admin, false).map(u => a);
            else
                return Future_1.Future.unit(a);
        });
    }
    removeAssignment(g, assignment, destrory = false) {
        return this.updateOne(g, group => {
            const index = group.assignments.indexOf(assignment);
            if (index >= 0)
                group.assignments.splice(index, 1);
        }).flatMap(group => {
            if (destrory)
                return Assignments_1.Assignments.instance.removeAssignment(assignment, false).map(a => group);
            else
                return Future_1.Future.unit(group);
        });
    }
    mkAndAddAssignment(g, assignment) {
        return Assignments_1.Assignments.instance.create(assignment).flatMap(a => this.addAssignment(g, a._id).map(g => a));
    }
    addAssignment(g, ass) {
        return this.updateOne(g, a => a.assignments.push(ass));
    }
    populateAssignments(query) {
        const pop = {
            path: "assignments",
            options: {
                sort: { due: 1 }
            }
        };
        return query.populate(pop);
    }
    populateStudents(query) {
        return this.populateUserType(query, "students");
    }
    populateAdmins(query) {
        return this.populateUserType(query, "admins");
    }
    populateUsers(query) {
        return this.populateStudents(this.populateAdmins(query));
    }
    populateFiles(query, fileFileter = {}) {
        return query.populate({
            path: "assignments",
            populate: {
                path: "files",
                match: fileFileter,
                populate: {
                    path: "students",
                    select: "name surename"
                }
            }
        });
    }
    populateUserType(query, typ) {
        return query.populate({
            path: typ,
            options: {
                sort: { name: 1, surename: 1, _id: 1 }
            }
        });
    }
    getStudents(g) {
        return this.map(this.populateStudents(this.getByID(g)), g => g.students);
    }
    getAdmins(g) {
        return this.map(this.populateAdmins(this.getByID(g)), g => g.admins);
    }
    isAdmin(g, user) {
        return this.map(this.getByID(g), g => g.admins.indexOf(user) >= 0);
    }
}
var Groups;
(function (Groups) {
    Groups.instance = new Group(Table_1.Tables.Group);
    function getGroups(user) {
        return Users_1.Users.instance.getGroups(user);
    }
    Groups.getGroups = getGroups;
    function getGroup(group) {
        return Groups.instance.exec(Groups.instance.populateUsers(Groups.instance.populateAssignments(Groups.instance.getByID(group))));
    }
    Groups.getGroup = getGroup;
    function removeGroup(group) {
        return Groups.instance.exec(Groups.instance.getByID(group), true).flatMap(g => {
            const removeFromGroup = (s) => Future_1.Future.lift(Users_1.Users.instance.removeFromGroup(s, g._id, false, false).then(user => List_1.List.mk(), (err) => List_1.List.mk(err)));
            const users = List_1.List.apply(g.students).append(List_1.List.apply(g.admins));
            const error = IOMap_1.IOMap.traverse(users, IOMap_1.IOMap.apply).run(removeFromGroup).map(s => List_1.List.concat(s));
            return Future_1.Future.lift(g.remove()).flatMap(g => error).flatMap(errors => {
                if (errors.length() == 0)
                    return Future_1.Future.unit(null);
                else
                    return Future_1.Future.reject(errors.foldLeft("", (acc, e) => acc + e + " "));
            });
        });
    }
    Groups.removeGroup = removeGroup;
})(Groups = exports.Groups || (exports.Groups = {}));
