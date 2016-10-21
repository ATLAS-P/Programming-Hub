"use strict";
const Result_1 = require("./Result");
const List_1 = require("../functional/List");
const IOMap_1 = require("../functional/IOMap");
//in principe just handy functions for working with IOMap<in, Out, A> when A instanceof Result
var AutoChecker;
(function (AutoChecker) {
    function foldLeft(a, f) {
        return IOMap_1.IOMap.ListHelper.foldLeft(a, (r, ltia) => r.combine(f(ltia._1, ltia._2)), new Result_1.Success(0));
    }
    AutoChecker.foldLeft = foldLeft;
    function evaluate(a, f) {
        return foldLeft(a, (a, b) => Result_1.Result.unit(a, f(a, b)));
    }
    AutoChecker.evaluate = evaluate;
    function foldZip(a, data, f) {
        return IOMap_1.IOMap.ListHelper.foldZip(a, data, (r, ttiaa) => r.combine(f(ttiaa._1, ttiaa._2)), new Result_1.Success(0));
    }
    AutoChecker.foldZip = foldZip;
    function evaluateWith(a, data, f) {
        return foldZip(a, data, (a, b) => Result_1.Result.unit(a[0], f(a[1], b)));
    }
    AutoChecker.evaluateWith = evaluateWith;
})(AutoChecker || (AutoChecker = {}));
var ioTest = AutoChecker.evaluate;
var dataTest = AutoChecker.evaluateWith;
var init = IOMap_1.IOMap.applyWithInput;
//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o);
const expected = (a, data) => dataTest(a, data, (a, b) => a == b);
//test input definitions
const randomStrings = List_1.List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"]);
const rndStringTest = IOMap_1.IOMap.traverse(randomStrings, s => init(s));
//generic grading function
function grade(r, algebra, test, success, error) {
    algebra(test).run(r).then(success, error);
}
function gradeIOEcho(r, success, error) {
    grade(r, inIsOut, rndStringTest, success, error);
}
function gradeProject(project, r, success, error) {
    switch (project) {
        case "io": gradeIOEcho(r, success, error);
    }
}
exports.gradeProject = gradeProject;
//# sourceMappingURL=AutoGrader.js.map