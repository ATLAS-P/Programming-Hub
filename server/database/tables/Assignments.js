"use strict";
const Table_1 = require('../Table');
const Groups_1 = require('./Groups');
const Future_1 = require('../../functional/Future');
class Assignment extends Table_1.Table {
    addFile(assignment, file) {
        return this.updateOne(assignment, s => {
            if (s.files.indexOf(file) < 0)
                s.files.push(file);
        });
    }
    populateFiles(query) {
        return query.populate({
            path: "files",
            populate: {
                path: "students.name students.surename"
            }
        });
    }
    removeAssignment(assignment, removeRef) {
        return this.exec(this.getByID(assignment)).flatMap(a => a.remove()).flatMap(a => {
            if (removeRef)
                return Groups_1.Groups.instance.removeAssignment(a.group, a._id).map(g => a);
            else
                return Future_1.Future.unit(a);
        });
    }
}
var Assignments;
(function (Assignments) {
    Assignments.instance = new Assignment(Table_1.Tables.Assignment);
})(Assignments = exports.Assignments || (exports.Assignments = {}));
