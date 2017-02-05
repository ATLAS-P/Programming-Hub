"use strict";
var MkTables;
(function (MkTables) {
    function mkUser(id, name, surename) {
        return {
            name: name,
            _id: id,
            surename: surename,
            groups: [],
            admin: false
        };
    }
    MkTables.mkUser = mkUser;
    function mkAssignment(name, group, due, typ, link = "", project = "") {
        return {
            name: name,
            due: due,
            files: [],
            typ: typ,
            project: project,
            link: link,
            group: group
        };
    }
    MkTables.mkAssignment = mkAssignment;
    function mkGroup(name, start, end, students = [], admins = []) {
        return {
            name: name,
            admins: admins,
            students: students,
            assignments: [],
            start: start,
            end: end
        };
    }
    MkTables.mkGroup = mkGroup;
    function mkFile(assignment, name, students, files, notes, feedback = "", autograder = []) {
        return {
            students: students,
            assignment: assignment,
            timestamp: new Date(),
            autograder: autograder,
            notes: notes,
            feedback: feedback,
            urls: files,
            name: name
        };
    }
    MkTables.mkFile = mkFile;
})(MkTables = exports.MkTables || (exports.MkTables = {}));
