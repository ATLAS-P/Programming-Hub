"use strict";
const mongoose = require("mongoose");
const List_1 = require("./Server/Autograder/List");
const IOMap_1 = require("./Server/Autograder/IOMap");
const Future_1 = require("./Server/Autograder/Future");
const projects = require("./miniprojects");
const student = new mongoose.Schema({
    name: String,
    surename: String,
    email: String,
    groups: [String],
}); //admin
const Student = mongoose.model('students', student);
const group = new mongoose.Schema({
    id: String,
    name: String,
    assignments: [String],
}); //admins, files, calendar, send mails, 
const Group = mongoose.model('groups', group);
const assignments = new mongoose.Schema({
    name: String,
    project: String,
    id: String,
    due: Date,
    files: [String]
});
const Task = mongoose.model('assignments', assignments);
const file = new mongoose.Schema({
    student: String,
    assignment: String,
    timestamp: Date,
    partners: [String],
    html: String,
    final: Boolean,
    reflection: String,
    feedback: String
});
const Files = mongoose.model('files', file);
function getUser(profile, fail, success) {
    Student.find({ email: profile.email.split("@")[0] }, (err, students) => err ? fail(err.toString()) : createProfile(profile, students, fail, success));
}
exports.getUser = getUser;
function getStudentsInGroup(query, group, success, fail) {
    Student.find({ groups: { $eq: group } }).find(query).sort({ name: 1 }).exec(function (err, res) {
        if (err)
            fail(err);
        else
            success(res);
    });
}
exports.getStudentsInGroup = getStudentsInGroup;
function createProfile(profile, current, fail, success) {
    const done = (student) => success({
        email: student.get("email"),
        name: student.get("name"),
        surename: student.get("surename")
    });
    if (current.length > 0)
        done(current[0]);
    else {
        const student = new Student({ email: profile.email.split("@")[0], name: profile.name.givenName, surename: profile.name.familyName, groups: [], files: [] });
        student.save((err, student) => err ? fail(err.toString()) : done(student));
    }
}
function getGroups(user, success, fail) {
    Student.find({ email: user }, function (err, student) {
        if (err)
            fail(err.toString());
        else
            Group.find({ id: { $in: student[0].get("groups") } }, function (err, groups) {
                if (err)
                    fail(err.toString());
                else
                    success(groups);
            });
    });
}
function getSimpleGroups(user, success, fail) {
    getGroups(user, (groups) => orderGroups(groups, success, fail), fail);
}
exports.getSimpleGroups = getSimpleGroups;
function orderGroups(groups, success, fail) {
    const runner = (group) => new Future_1.Future(function (resolve, reject) {
        Task.find({ id: { $in: group.get("assignments") } }, function (err, ass) {
            if (err)
                reject(err);
            else
                resolve(ass);
        });
    });
    const collector = IOMap_1.IOMap.traverse(List_1.List.apply(groups), IOMap_1.IOMap.apply);
    collector.run(runner).then(function (assignments) {
        const final = List_1.List.apply(groups).map2(assignments, mapGroup);
        success(final.toArray());
    }, fail);
}
function mapGroup(group, assignments) {
    const today = new Date();
    const next = List_1.List.apply(assignments).foldLeft([0, null], function (acc, next) {
        const nextDate = next.get("due");
        const open = nextDate > today;
        if (!acc[1]) {
            if (open)
                return [1, next];
            else
                return acc;
        }
        else if (open && nextDate < acc[1].get("due"))
            return [acc[0] + 1, next];
        else
            return [acc[0] + (open ? 1 : 0), acc[1]];
    });
    const open = next[0];
    return {
        id: group.get("id"),
        name: group.get("name"),
        open: open,
        nextd: open > 0 ? next[1].get("due") : null,
        nextp: open > 0 ? next[1].get("name") : null
    };
}
function collectAssignments(group, success, fail) {
    Group.find({ id: group }, function (err, theGroup) {
        if (err)
            fail(err);
        else if (theGroup.length == 0)
            fail("The group does not exsit!");
        else {
            let assignments = theGroup[0].get("assignments");
            Task.find({ id: { $in: assignments } }).sort({ due: -1 }).exec(function (err, asses) {
                const runnerGetProject = (ass) => new Future_1.Future(function (resolve, reject) {
                    projects.getFull({ id: ass.get("project") }, (data) => resolve(data[0]), reject);
                });
                const collector = IOMap_1.IOMap.traverse(List_1.List.apply(asses), IOMap_1.IOMap.apply);
                collector.run(runnerGetProject).then(function (projects) {
                    let assignments = List_1.List.apply(asses).map2(projects, buildAssignment);
                    let openClosed = splitOpenClosed(assignments);
                    success(openClosed[0], openClosed[1], mapGroupSimple(theGroup[0]));
                }, fail);
            });
        }
    });
}
exports.collectAssignments = collectAssignments;
function splitOpenClosed(ass) {
    return ass.foldLeft([[], []], function (acc, next) {
        if (new Date(next.due) > new Date()) {
            return [acc[0].concat(next), acc[1]];
        }
        else {
            return [acc[0], acc[1].concat(next)];
        }
    });
}
function mapGroupSimple(g) {
    return {
        id: g.get("id"),
        name: g.get("name")
    };
}
function buildAssignment(task, project) {
    return {
        name: project.get("name"),
        due: task.get("due"),
        level: project.get("level"),
        id: project.get("id"),
        assignment: task.get("id"),
        link: project.get("id") + ".py" //remove and just do it in js
    };
}
//# sourceMappingURL=students.js.map