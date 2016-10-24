"use strict";
var Users;
(function (Users) {
    Users.rikmuld = {
        name: "rikmuld",
        password: "atlaspass"
    };
})(Users || (Users = {}));
var Config;
(function (Config) {
    Config.auth = {
        id: "149489641596-1gjod03kio5biqdcaf4cs6hpgvu8nmof.apps.googleusercontent.com",
        key: "F7giEmz6HL9N2ZZ-1GVewAw7"
    };
    Config.db = {
        address: "ds033986.mlab.com",
        port: 33986,
        db: "autograder",
        user: Users.rikmuld
    };
})(Config = exports.Config || (exports.Config = {}));
//# sourceMappingURL=Config.js.map