"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var Stopwatch;
(function (Stopwatch) {
    function init() {
        const data = List_1.List.apply([
            List_1.List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
            List_1.List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
            List_1.List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple_1.Tuple(d[0], d[1]))
        ]);
        //better way
        //const randTest = (s1: number, s2: number, n: number) => DataHelper.rndList(s1, n, "t", "p", "l").addAll("l", "s").zip(DataHelper.rndInt(s2, n + 2, 25, 2500))
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testDataCurry(List_1.List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out, data) => {
            const lapRaw = out.tail().head("").split(":");
            if (lapRaw.length != 2)
                return new Tuple_1.Tuple(false, "There seems to be something wrong with your lap logic or print format.");
            const total = getFirstNumber(out.head(""), 0);
            const lap = getFirstNumber(lapRaw[0], 0);
            const lapTime = getFirstNumber(lapRaw[1], 0);
            if (!numInRange(total * 1000, data[0], data[1])) {
                return new Tuple_1.Tuple(false, "Your final time does not seem to be correct, expected a time between: " + data[0] + " and " + data[1] + " miliseconds. Found: " + total * 1000 + " miliseconds");
            }
            else if (!numInRange(lapTime * 1000, data[2], data[3])) {
                return new Tuple_1.Tuple(false, "Your final lap time does not seem to be correct, expected a time between: " + data[2] + " and " + data[3] + " miliseconds. Found: " + lapTime * 1000 + " miliseconds");
            }
            else if (lap != data[4]) {
                return new Tuple_1.Tuple(false, "Your lap count seems to be wrong, found: " + lap + ", expected: " + data[4]);
            }
            return new Tuple_1.Tuple(true, "");
        });
        const runner = Runners_1.Runners.PythonRunners.sleepIO;
        return new Projects_1.Project(runner, test, input);
    }
    Stopwatch.init = init;
    function numInRange(x, low, high) {
        return low <= x && x <= high;
    }
    //put in regex module, also in resersed
    function getFirstNumber(s, z) {
        const reg = /^\D*(\d+(?:\.\d+)?)/g;
        const match = reg.exec(s);
        if (!match)
            return z;
        else
            return Number(match[1]);
    }
})(Stopwatch = exports.Stopwatch || (exports.Stopwatch = {}));
//# sourceMappingURL=Stopwatch.js.map