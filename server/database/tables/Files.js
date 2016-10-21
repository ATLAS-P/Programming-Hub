"use strict";
const Table_1 = require('../Table');
class File extends Table_1.Table {
    getByID(id, success, fail) {
        fail("Get by ID function not supported for file, use getForStudent instead");
    }
    getForStudent(s, g, success, fail) {
        super.get({ student: s, group: s }, {}, success, fail);
    }
}
var Files;
(function (Files) {
    Files.instance = new File(Table_1.Tables.File);
})(Files = exports.Files || (exports.Files = {}));
//# sourceMappingURL=Files.js.map