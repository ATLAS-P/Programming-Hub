"use strict";
const Table_1 = require('../Table');
const Users_1 = require('./Users');
const Assignments_1 = require('./Assignments');
const Files_1 = require('./Files');
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
    getStudents(g, success, fail) {
        this.do(this.model.find({ _id: g }).populate("students"), g => {
            success(g[0].students);
        }, fail);
    }
}
var Groups;
(function (Groups) {
    Groups.instance = new Group(Table_1.Tables.Group);
    //expensive... perhaps better to not show upcomming deadlines per group this way... although with this it is easy to extract upcomming deadlines and those can also be given then
    function getOverviewForUser(user, success, fail) {
        Users_1.Users.instance.getGroups(user, false, (gs) => {
            const lg = List_1.List.apply(gs);
            const assignments = List_1.List.concat(lg.map(g => List_1.List.apply(g.assignments.map(a => a._id)))).toArray();
            Files_1.Files.instance.getAssignmentsFinal(user, assignments, files => {
                success(groupsToOverview(lg.map(g => {
                    const open = g.assignments.filter(a => files.find(f => f.assignment == a._id) ? false : true);
                    g.assignments = open;
                    return g;
                }).toArray()));
            }, fail);
        }, fail);
    }
    Groups.getOverviewForUser = getOverviewForUser;
    function getGroupDetails(s, g, success, fail) {
        Groups.instance.getAndPopulate({ _id: g }, true, false, g => {
            let assignments = List_1.List.apply(g[0].assignments);
            Files_1.Files.instance.getAssignmentsFinal(s, assignments.map(a => a._id).toArray(), files => {
                let split = assignments.filter2(a => files.find(f => f.assignment == a._id) ? true : false);
                let doneAss = split._1.map(a => {
                    a.due = files.find(f => f.assignment == a._id).timestamp;
                    return a;
                });
                const openClosed = List_1.List.apply(split._2.toArray()).foldLeft(new Tuple_1.Tuple(List_1.List.apply([]), List_1.List.apply([])), foldAssignmentDetails);
                success(mkGroupDetails(g[0]._id, g[0].name, openClosed._1.toArray(), openClosed._2.toArray(), doneAss.toArray()));
            }, fail);
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
    function mkGroupDetails(id, name, open, closed, done) {
        return {
            id: id,
            name: name,
            openAssignments: open,
            closedAssignments: closed,
            doneAssignments: done
        };
    }
})(Groups = exports.Groups || (exports.Groups = {}));
//# sourceMappingURL=Groups.js.map