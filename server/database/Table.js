"use strict";
const mongoose = require('mongoose');
const List_1 = require('../functional/List');
const Future_1 = require('../functional/Future');
const IOMap_1 = require('../functional/IOMap');
class Table {
    constructor(m) {
        this.model = m;
    }
    exec(query, alwaysOne = true) {
        const exists = res => {
            if (!res)
                return false;
            else if (res.length) {
                return res.length > 0;
            }
            else
                return true;
        };
        return new Future_1.Future((resolve, reject) => {
            query.exec((err, res) => {
                if (err)
                    reject(err.message);
                else if (alwaysOne && !exists(res))
                    reject("No entries found");
                else
                    resolve(res);
            });
        });
    }
    get(query) {
        return this.model.find(query);
    }
    getByIDs(ids) {
        return this.get({ _id: { $in: ids } });
    }
    getAll() {
        return this.get({});
    }
    getOne(query) {
        return this.model.findOne(query);
    }
    getByID(id) {
        return this.getOne({ _id: id });
    }
    updateOne(id, update) {
        return this.exec(this.getByID(id)).flatMap(a => {
            update(a);
            return a.save();
        });
    }
    update(ids, update) {
        return this.exec(this.getByIDs(ids)).flatMap(a => {
            return IOMap_1.IOMap.traverse(List_1.List.apply(a), IOMap_1.IOMap.apply).run(a2 => {
                update(a2);
                return Future_1.Future.lift(a2.save());
            }).map(la => la.toArray());
        });
    }
    create(a) {
        return Future_1.Future.lift(this.model.create(a));
    }
    map(query, f) {
        return this.exec(query, true).map(f);
    }
}
exports.Table = Table;
var Tables;
(function (Tables) {
    Tables.user = new mongoose.Schema({
        _id: String,
        name: String,
        surename: String,
        groups: [{
                group: refrence("Group"),
                files: [{
                        final: Boolean,
                        file: refrence("File")
                    }]
            }],
        admin: Boolean
    });
    Tables.assignment = new mongoose.Schema({
        files: [refrence("File")],
        due: Date,
        group: refrence("Group"),
        name: String,
        link: String,
        typ: String,
        project: String
    });
    Tables.group = new mongoose.Schema({
        name: String,
        assignments: [refrence("Assignment")],
        students: [refrence("User")],
        admins: [refrence("User")],
        start: Date,
        end: Date
    });
    Tables.file = new mongoose.Schema({
        assignment: refrence("Assignment"),
        timestamp: Date,
        students: [refrence("User")],
        autograder: [{
                input: Object,
                success: Boolean,
                message: String
            }],
        notes: String,
        feedback: String,
        urls: [String],
        name: String
    });
    function refrence(to) {
        return { type: String, ref: to };
    }
    Tables.User = mongoose.model('User', Tables.user);
    Tables.Assignment = mongoose.model('Assignment', Tables.assignment);
    Tables.File = mongoose.model('File', Tables.file);
    Tables.Group = mongoose.model('Group', Tables.group);
})(Tables = exports.Tables || (exports.Tables = {}));
