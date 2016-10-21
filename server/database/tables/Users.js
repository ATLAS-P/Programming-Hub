"use strict";
const Table_1 = require('../Table');
const Groups_1 = require('./Groups');
class User extends Table_1.Table {
    addToGroup(s, g, updateGroup, admin, done, fail) {
        this.updateOne(s, (a) => {
            if (a.groups.indexOf(g) == -1)
                a.groups.push(g);
        }, a => {
            if (updateGroup)
                Groups_1.Groups.instance.addUser(g, s, admin, false, done, fail);
            else
                done();
        }, fail);
    }
    inGroup(g, query, sort, suc, err) {
        query['groups'] = { $eq: g };
        this.get(query, sort ? { name: 1 } : {}, suc, err);
    }
    getGroups(s, deep, suc, err) {
        this.getByID(s, u => Groups_1.Groups.instance.getAndPopulate({ _id: { $in: u.groups } }, false, deep, suc, err), err);
    }
}
var Users;
(function (Users) {
    Users.instance = new User(Table_1.Tables.User);
    function getByGProfile(p, suc, err) {
        const id = getIDByGProfile(p);
        //TODO not sure if getByID (findOne) will return successfully if no were found, test
        Users.instance.getByID(id, user => returnOrCreate(id, p, user, suc, err), err);
    }
    Users.getByGProfile = getByGProfile;
    function simplify(u) {
        return mkSimpleUser(u._id, u.name, u.surename);
    }
    Users.simplify = simplify;
    function mkSimpleUser(id, name, surename) {
        return {
            id: id,
            name: name,
            surename: surename
        };
    }
    Users.mkSimpleUser = mkSimpleUser;
    function getIDByGProfile(p) {
        return p.email.split("@")[0];
    }
    Users.getIDByGProfile = getIDByGProfile;
    function returnOrCreate(id, p, user, suc, err) {
        if (user)
            suc(user);
        else {
            const user = Table_1.Tables.mkUser(id, p.name.givenName, p.name.familyName);
            Users.instance.create(user, () => suc(user), Table_1.Table.error);
        }
    }
    Users.returnOrCreate = returnOrCreate;
})(Users = exports.Users || (exports.Users = {}));
//# sourceMappingURL=Users.js.map