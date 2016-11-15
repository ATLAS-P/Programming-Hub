"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var Fibonacci;
(function (Fibonacci) {
    function init() {
        const data = List_1.List.mk([1, 2, 75, 9, 23, 14, 120, 42], [8, -4, 0, 12, 20, 20, 1284, 42], [1, 1, 2584, 37, 145, 12, 543, 9]).map(a => List_1.List.apply(a).map(a => a.toString()));
        const results = List_1.List.mk([89, 89, 21, 987, 144, 701408733], [3, 136, 8, 6388, 1508, 252983944], [17, 39088169, 144, 233, 610, 55]).map(a => List_1.List.apply(a).map(a => a.toString()));
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testDataCurry(results, (out, data) => {
            const test = (n) => doTest(n, out.get((n - 1) * 2), out.get(n * 2 - 1), data.get((n - 1) * 2), data.get(n * 2 - 1));
            const error = test(1) + test(2) + test(3);
            return new Tuple_1.Tuple(error == "", error);
        });
        const runner = Runners_1.Runners.PythonRunners.multiIO;
        return new Projects_1.Project(runner, test, input);
    }
    Fibonacci.init = init;
    function doTest(n, iff, is, off, os) {
        if (iff != off)
            return "For pair #" + n + " the first test (index or closest) fails. Expected: '" + off + "', got: '" + iff + "'. ";
        else if (is != os)
            return "For pair #" + n + " the second test (value at index) fails. Expected: '" + off + "', got: '" + iff + "'. ";
        else
            return "";
    }
})(Fibonacci = exports.Fibonacci || (exports.Fibonacci = {}));
//# sourceMappingURL=Fibonacci.js.map