"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var TextFrame;
(function (TextFrame) {
    function init() {
        const data = List_1.List.apply(["hallo!", "hallo, world", "university, college, atlas", "the, quick, brown, fox, jumps, over, the, lazy, dog"]);
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testIOCurry(frameCheck);
        const runner = Runners_1.Runners.PythonRunners.simpleIOasList;
        return new Projects_1.Project(runner, test, input);
    }
    TextFrame.init = init;
    function frameCheck(inn, out) {
        const dict = out.head("");
        const frame = out.tail().foldLeft("", (acc, next) => acc + next);
        return new Tuple_1.Tuple(false, "");
    }
    TextFrame.frameCheck = frameCheck;
})(TextFrame = exports.TextFrame || (exports.TextFrame = {}));
//# sourceMappingURL=TextFrame.js.map