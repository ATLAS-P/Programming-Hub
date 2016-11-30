"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var TextFrame;
(function (TextFrame) {
    function init() {
        const data = List_1.List.apply(["hallo!", "hallo,world", "university,college,atlas", "the,quick,brown,fox,jumps,over,the,lazy,dog"]);
        const results = List_1.List.apply([
            ["*********** hallo! ***********", "{'!': 1, 'o': 1, 'a': 1, 'h': 1, 'l': 2}"],
            ["********** hallo ** world **********", "{'d': 1, 'r': 1, 'h': 1, 'o': 2, 'w': 1, 'a': 1, 'l': 3}"],
            ["*************** university ** college    ** atlas      ***************", "{'u': 1, 'n': 1, 'i': 2, 'v': 1, 'l': 3, 'r': 1, 'o': 1, 'e': 3, 'y': 1, 'g': 1, 'c': 1, 's': 2, 't': 2, 'a': 2}"],
            ["********** the   ** quick ** brown ** fox   ** jumps ** over  ** the   ** lazy  ** dog   **********", "{'y': 1, 'h': 2, 'j': 1, 'u': 2, 'v': 1, 'f': 1, 'a': 1, 'w': 1, 'q': 1, 'x': 1, 's': 1, 'm': 1, 'l': 1, 'c': 1, 'z': 1, 'n': 1, 'i': 1, 'b': 1, 't': 2, 'p': 1, 'o': 4, 'd': 1, 'k': 1, 'g': 1, 'r': 2, 'e': 3}"]
        ]);
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testDataCurry(results, frameCheck);
        const runner = Runners_1.Runners.PythonRunners.simpleIOasList;
        return new Projects_1.Project(runner, test, input);
    }
    TextFrame.init = init;
    function frameCheck(out, expected) {
        const frame = out.foldLeft("", (acc, next) => acc + next);
        if (expected[0] != frame)
            return new Tuple_1.Tuple(false, "Your frame was printed incorrectly, expected: '" + expected[0] + "', found: '" + frame + "'");
        else
            return new Tuple_1.Tuple(true, "");
    }
    TextFrame.frameCheck = frameCheck;
})(TextFrame = exports.TextFrame || (exports.TextFrame = {}));
//# sourceMappingURL=TextFrame.js.map