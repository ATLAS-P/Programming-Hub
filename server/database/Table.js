"use strict";
const mongoose = require('mongoose');
//change all to use promise no callback
class Table {
    constructor(m) {
        this.model = m;
    }
    get(query, sort, success, fail) {
        this.model.find(query).sort(sort).exec((err, res) => {
            if (err)
                fail(err);
            else if (res.length == 0)
                fail("No entries found");
            else
                success(res);
        });
    }
    getOne(query, sort, success, fail, safe = true) {
        this.model.findOne(query).sort(sort).exec((err, res) => {
            if (err)
                fail(err);
            else if (!res && safe)
                fail("No entries found");
            else
                success(res);
        });
    }
    updateOne(id, update, success, fail) {
        this.getByID(id, a => {
            update(a);
            a.save((err, a, affect) => {
                if (err)
                    fail(err);
                else
                    success(a);
            });
        }, fail);
    }
    do(query, success, fail) {
        query.exec((err, res) => {
            if (err)
                fail(err);
            else if (res.length == 0)
                fail("No entries found");
            else
                success(res);
        });
    }
    doOne(query, success, fail) {
        query.exec((err, res) => {
            if (err)
                fail(err);
            else if (!res)
                fail("No entries found");
            else
                success(res);
        });
    }
    getByID(id, success, fail, safe = true) {
        this.getOne({ _id: id }, {}, success, fail, safe);
    }
    getByIDs(ids, success, fail) {
        this.get({ _id: { $in: ids } }, {}, success, fail);
    }
    getAll(success, fail) {
        this.get({}, {}, success, fail);
    }
    create(a, done, fail) {
        this.model.create(a, (err, res) => {
            if (err)
                fail(err);
            else
                done();
        });
    }
}
exports.Table = Table;
(function (Table) {
    function error(err) {
        console.log(err);
    }
    Table.error = error;
    function done() {
        console.log("done!");
    }
    Table.done = done;
})(Table = exports.Table || (exports.Table = {}));
var Tables;
(function (Tables) {
    function mkProject(id, name, level, info, type) {
        return {
            name: name,
            _id: id,
            level: level,
            info: info,
            type: type
        };
    }
    Tables.mkProject = mkProject;
    function mkUser(id, name, surename) {
        return {
            name: name,
            _id: id,
            surename: surename,
            groups: []
        };
    }
    Tables.mkUser = mkUser;
    function mkAssignment(id, project, due) {
        return {
            _id: id,
            project: project,
            due: due
        };
    }
    Tables.mkAssignment = mkAssignment;
    function mkGroup(id, name, students = [], admins = []) {
        return {
            _id: id,
            name: name,
            admins: admins,
            students: students,
            assignments: []
        };
    }
    Tables.mkGroup = mkGroup;
    function mkFile(student, assignment, timestamp, partners, json, final, reflection, feedback = "") {
        return {
            student: student,
            assignment: assignment,
            timestamp: timestamp,
            partners: partners,
            html: json,
            final: final,
            reflection: reflection,
            feedback: feedback
        };
    }
    Tables.mkFile = mkFile;
    Tables.project = new mongoose.Schema({
        _id: String,
        name: String,
        level: Number,
        info: String,
        type: String
    });
    Tables.user = new mongoose.Schema({
        _id: String,
        name: String,
        surename: String,
        groups: [refrence("Group")],
        admin: Boolean
    });
    Tables.assignment = new mongoose.Schema({
        _id: String,
        project: refrence("Project"),
        due: Date
    });
    Tables.group = new mongoose.Schema({
        _id: String,
        name: String,
        assignments: [refrence("Assignment")],
        students: [refrence("User")],
        admins: [refrence("User")]
    });
    Tables.file = new mongoose.Schema({
        student: refrence("User"),
        assignment: refrence("Assignment"),
        timestamp: Date,
        partners: [refrence("User")],
        html: Object,
        final: Boolean,
        reflection: String,
        feedback: String
    });
    function refrence(to) {
        return { type: String, ref: to };
    }
    Tables.Assignment = mongoose.model('Assignment', Tables.assignment);
    Tables.File = mongoose.model('File', Tables.file);
    Tables.Group = mongoose.model('Group', Tables.group);
    Tables.User = mongoose.model('User', Tables.user);
    Tables.Project = mongoose.model('Project', Tables.project);
})(Tables = exports.Tables || (exports.Tables = {}));
//# sourceMappingURL=Table.js.map