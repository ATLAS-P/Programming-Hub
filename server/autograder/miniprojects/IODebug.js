"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
var IODebug;
(function (IODebug) {
    function init() {
        const data = List_1.List.mk("this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder");
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.Tests.inIsOut;
        const runner = Runners_1.Runners.PythonRunners.simpleIO;
        return new Projects_1.Project(runner, test, input);
    }
    IODebug.init = init;
})(IODebug = exports.IODebug || (exports.IODebug = {}));
//# sourceMappingURL=IODebug.js.map