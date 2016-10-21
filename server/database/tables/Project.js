"use strict";
const mongoose = require('mongoose');
const Table_1 = require('../Table');
var Project;
(function (Project) {
    Project.instance = new Table_1.Table(mongoose.model('Project', Table_1.Tables.project));
    Project.instance.create(Table_1.Tables.mkProject("io", "IO echo", 0, "#", "code_auto"), Table_1.Table.done, Table_1.Table.error);
})(Project = exports.Project || (exports.Project = {}));
//# sourceMappingURL=Project.js.map