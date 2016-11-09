"use strict";
const Table_1 = require('../Table');
class Assignment extends Table_1.Table {
    addFile(assignment, file, success, fail) {
        this.updateOne(assignment, s => {
            if (s.files.indexOf(file) < 0)
                s.files.push(file);
        }, a => success(), fail);
    }
}
var Assignments;
(function (Assignments) {
    Assignments.instance = new Assignment(Table_1.Tables.Assignment);
})(Assignments = exports.Assignments || (exports.Assignments = {}));
//# sourceMappingURL=Assignments.js.map