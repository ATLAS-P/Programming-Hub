"use strict";
const Table_1 = require('../Table');
const Assignments_1 = require('./Assignments');
const Groups_1 = require('./Groups');
class File extends Table_1.Table {
    create(a, done, fail) {
        this.removeNonFinal(a.student, a.assignment);
        Assignments_1.Assignments.instance.addFile(a.assignment, a._id, () => {
            super.create(a, done, fail);
        }, fail);
    }
    getAssignment(s, a, success, fail) {
        super.getOne({ student: s, assignment: a }, {}, success, fail);
    }
    getDeepAssignment(s, a, success, fail) {
        this.do(this.model.find({ student: s, assignment: a }).populate({
            path: "assignment",
            populate: {
                path: "project"
            }
        }).populate({ path: "partners student" }), f => success(f[0]), fail);
    }
    getAssignmentsFinal(s, la, success, fail) {
        this.model.find({ student: s, assignment: { $in: la }, final: true }, (err, res) => {
            if (err)
                fail(err);
            else
                success(res);
        });
    }
    getNonFinalFor(s, success, fail) {
        this.do(this.model.find({ student: s, final: false }).populate({
            path: "assignment",
            populate: {
                path: "project"
            }
        }), success, fail);
    }
    //add callbacks
    removeNonFinal(s, ass) {
        this.model.find({ student: s, assignment: ass, final: false }).remove().exec();
    }
    mkFinal(s, ass) {
        this.model.findOne({ student: s, assignment: ass, final: false }).update({ final: true }).exec();
    }
    updateFeedback(id, feedback, success, fail) {
        this.updateOne(id, (file) => {
            file.feedback = feedback;
        }, success, fail);
    }
}
var Files;
(function (Files) {
    Files.instance = new File(Table_1.Tables.File);
    function getID(assignment, student) {
        return assignment + "_" + student;
    }
    Files.getID = getID;
    function getForStudent(s, g, suc, error) {
        getForGroup(g, { "student": s }, suc, error);
    }
    Files.getForStudent = getForStudent;
    function getAllForGroup(g, suc, error) {
        getForGroup(g, {}, suc, error);
    }
    Files.getAllForGroup = getAllForGroup;
    function getForGroup(g, fileFileter, suc, error) {
        Groups_1.Groups.instance.model.find({ _id: g }).populate({
            path: "assignments",
            populate: {
                path: "files",
                match: fileFileter,
                populate: {
                    path: "student partners"
                }
            }
        }).populate({
            path: "assignments",
            populate: {
                path: "project"
            }
        }).exec((err, g) => {
            if (err)
                error(err);
            else if (g.length > 0)
                suc(g[0]);
            else
                error("No group with id: " + g + " found!");
        });
    }
    Files.getForGroup = getForGroup;
})(Files = exports.Files || (exports.Files = {}));
//# sourceMappingURL=Files.js.map