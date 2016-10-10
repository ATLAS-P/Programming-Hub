"use strict";
const mongoose = require('mongoose');
const helper = require('./Autograder');
const miniproject = new mongoose.Schema({
    name: String,
    id: String,
    lecture: Number,
    level: Number
});
const Miniproject = mongoose.model('miniproject', miniproject);
function getprojects(success, fail) {
    Miniproject.find({}).sort({ lecture: -1, level: -1 }).exec(function (err, projects) {
        if (err)
            fail(err);
        else
            success(projects);
    });
}
function getAll(success, fail) {
    getprojects((p) => success(helper.ArrayHelper.map(p, transformProject)), fail);
}
exports.getAll = getAll;
function transformProject(m) {
    return {
        name: m.name,
        lecture: m.lecture,
        level: m.lecture,
        id: m.id,
        link: m.id + ".py"
    };
}
//# sourceMappingURL=miniprojects.js.map