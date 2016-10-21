"use strict";
const Table_1 = require('../Table');
const Users_1 = require('./Users');
const Assignments_1 = require('./Assignments');
const List_1 = require('../../functional/List');
const Tuple_1 = require('../../functional/Tuple');
class Group extends Table_1.Table {
    create(group, done, err) {
        super.create(group, () => {
            const addToGroup = (s) => Users_1.Users.instance.addToGroup(s, group._id, false, false, done, err);
            group.students.forEach(addToGroup);
            group.admins.forEach(addToGroup);
        }, err);
    }
    addUser(g, s, admin, updateStudent, done, fail) {
        this.updateOne(g, (a) => {
            if (admin) {
                if (a.admins.indexOf(s) == -1)
                    a.admins.push(s);
            }
            else {
                if (a.students.indexOf(s) == -1)
                    a.students.push(s);
            }
        }, a => {
            if (updateStudent)
                Users_1.Users.instance.addToGroup(s, g, admin, false, done, fail);
            else
                done();
        }, fail);
    }
    mkAndAddAssignment(g, assignment, success, fail) {
        Assignments_1.Assignments.instance.create(assignment, () => Groups.instance.addAssignment(g, assignment._id, success, fail), fail);
    }
    addAssignment(g, ass, success, fail) {
        Groups.instance.updateOne(g, a => a.assignments.push(ass), success, fail);
    }
    getAndPopulate(query, deep, users, success, fail) {
        const pop = deep ? {
            path: users ? "assignments students admins" : "assignments",
            populate: {
                path: "project"
            }
        } : { path: "assignments" };
        this.do(this.model.find(query).populate(pop), g => {
            success(g);
        }, fail);
    }
}
var Groups;
(function (Groups) {
    Groups.instance = new Group(Table_1.Tables.Group);
    function getOverviewForUser(user, success, fail) {
        Users_1.Users.instance.getGroups(user, false, (gs) => success(groupsToOverview(gs)), fail);
    }
    Groups.getOverviewForUser = getOverviewForUser;
    function getGroupDetails(g, success, fail) {
        Groups.instance.getAndPopulate({ _id: g }, true, false, g => {
            success(groupToDetails(g[0]));
        }, fail);
    }
    Groups.getGroupDetails = getGroupDetails;
    function groupsToOverview(g) {
        return List_1.List.apply(g).map(groupToOverview).toArray();
    }
    function groupToOverview(g) {
        const data = List_1.List.apply(g.assignments).foldLeft(new Tuple_1.Tuple3(0, "", new Date()), foldAssignmentOverview);
        return mkGroupOverview(g._id, g.name, data._1, data._2, data._3);
    }
    function groupToDetails(g) {
        const data = List_1.List.apply(g.assignments).foldLeft(new Tuple_1.Tuple(List_1.List.apply([]), List_1.List.apply([])), foldAssignmentDetails);
        return mkGroupDetails(g._id, g.name, data._1.toArray(), data._2.toArray());
    }
    function foldAssignmentOverview(data, a) {
        if (a.due > new Date()) {
            if (data._3 < a.due)
                return new Tuple_1.Tuple3(data._1 + 1, a.project, a.due);
            else
                return new Tuple_1.Tuple3(data._1 + 1, data._2, data._3);
        }
        else
            return data;
    }
    function foldAssignmentDetails(data, a) {
        if (a.due > new Date())
            return new Tuple_1.Tuple(data._1.add(a), data._2);
        else
            return new Tuple_1.Tuple(data._1, data._2.add(a));
    }
    function mkGroupOverview(id, name, openAssignments, nextProject, nextDeadline) {
        return {
            id: id,
            name: name,
            openAssignments: openAssignments,
            nextProject: nextProject,
            nextDeadline: nextDeadline
        };
    }
    function mkGroupDetails(id, name, open, closed) {
        return {
            id: id,
            name: name,
            openAssignments: open,
            closedAssignments: closed
        };
    }
})(Groups = exports.Groups || (exports.Groups = {}));
//# sourceMappingURL=Groups.js.map