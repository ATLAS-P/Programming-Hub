"use strict";
const mongoose = require('mongoose');
const List_1 = require('./Server/Autograder/List');
const miniproject = new mongoose.Schema({
    name: String,
    id: String,
    level: Number
}); //info -> link etc.. / type (code, text handin, task no handin, just deadline)
const Miniproject = mongoose.model('miniproject', miniproject);
function getprojects(query, success, fail) {
    Miniproject.find(query).sort({ lecture: -1, level: -1 }).exec(function (err, projects) {
        if (err)
            fail(err);
        else
            success(projects);
    });
}
function get(query, success, fail) {
    getprojects(query, (p) => success(List_1.List.apply(p).map(transformProject)), fail);
}
exports.get = get;
function getFull(query, success, fail) {
    getprojects(query, (p) => success(p), fail);
}
exports.getFull = getFull;
exports.getAll = (success, fail) => get({}, success, fail);
exports.getProject = (id, success, fail) => get({ id: id }, success, fail);
function transformProject(m) {
    return {
        name: m.name,
        level: m.level,
        id: m.id,
        link: m.id + ".py"
    };
}
//# sourceMappingURL=miniprojects.js.map