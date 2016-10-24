"use strict";
const Table_1 = require('../Table');
class File extends Table_1.Table {
    create(a, done, fail) {
        this.removeNonFinal(a.student, a.assignment);
        super.create(a, done, fail);
    }
    getByID(id, success, fail) {
        fail("Get by ID function not supported for file, use getForStudent instead");
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
}
var Files;
(function (Files) {
    Files.instance = new File(Table_1.Tables.File);
})(Files = exports.Files || (exports.Files = {}));
//# sourceMappingURL=Files.js.map