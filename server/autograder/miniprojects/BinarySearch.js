"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var BinarySearch;
(function (BinarySearch) {
    function init() {
        const buildSet = (tries, set) => tries.map(a => set.add(set.length()).add(a).map(b => b.toString()));
        const tries12 = List_1.List.apply([0, 1, 2, 25, 85, 100, 101]);
        const set1 = List_1.List.range2(101, 0);
        const set2 = List_1.List.range2(100, 1);
        const set3 = Projects_1.DataHelper.rndInt(67864, 100, 1000, 10000).sort();
        const tries3 = Projects_1.DataHelper.rndList2(45343, 10, set3.toArray());
        const data = List_1.List.concat(List_1.List.apply([
            buildSet(tries12, set1),
            buildSet(tries12, set2),
            buildSet(tries3, set3)
        ]));
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testIOCurry(optimalAndProper);
        const runner = Runners_1.Runners.PythonRunners.listInSimpleOut;
        return new Projects_1.Project(runner, test, input);
    }
    BinarySearch.init = init;
    function optimalAndProper(inn, out) {
        const search = inn.head(0);
        const data = inn.tail().tail();
        const expected = data.toArray().indexOf(search);
        if (expected != out)
            return new Tuple_1.Tuple(false, "The returned index is not correct, expected: " + expected + ", found: " + out);
        else
            return new Tuple_1.Tuple(true, "");
    }
})(BinarySearch = exports.BinarySearch || (exports.BinarySearch = {}));
