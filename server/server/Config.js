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
        key: "F7giEmz6HL9N2ZZ-1GVewAw7",
        callback: "localhost:3000"
    };
    Config.db = {
        address: "ds033986.mlab.com",
        port: 33986,
        db: "autograder",
        user: Users.rikmuld
    };
    Config.grader = {
        break: "\r\n",
        lang: {
            python: "python"
        }
    };
    Config.session = {
        redis: false,
        secret: "Psssst! Keep it a secret!"
    };
})(Config = exports.Config || (exports.Config = {}));
//# sourceMappingURL=Config.js.map