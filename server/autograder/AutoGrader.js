"use strict";
const Future_1 = require("../functional/Future");
const Result_1 = require("./Result");
const List_1 = require("../functional/List");
const IOMap_1 = require("../functional/IOMap");
const process = require('child_process');
//put in config
const BREAK = '\n';
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
const greenBottles = a => ioTest(a, validateGreenBottles);
function validateGreenBottles(n, out) {
    const input = parseInt(n);
    const build = (n, acc = "") => {
        const bottleName = (a) => a > 1 ? "bottles" : "bottle";
        const mss = n + " green " + bottleName(n) + " hanging on the wall" + BREAK;
        const acc2 = acc + mss + mss + "And if one green bottle should accidentally fall" + BREAK;
        if (n - 1 == 0)
            return acc2 + "There'll be no green bottle hanging on the wall" + BREAK;
        else
            return build(n - 1, acc2 + "There'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall" + BREAK + BREAK);
    };
    return build(input) == out;
}
//test input definitions
const randomStrings = List_1.List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"]);
const lowInts = List_1.List.apply([1, 2, 5]).map(i => i.toString());
const rndStringTest = IOMap_1.IOMap.traverse(randomStrings, s => init(s));
const lowIntsTest = IOMap_1.IOMap.traverse(lowInts, s => init(s));
//generic grading function
function grade(r, algebra, test, success, error) {
    algebra(test).run(r).then(success, error);
}
function gradeProject(project, filename, success, error) {
    switch (project) {
        case "io": grade(Runners.simpleIO(filename), inIsOut, rndStringTest, success, error);
        case "n_green_bottles": grade(Runners.simpleIO(filename), greenBottles, lowIntsTest, success, error);
    }
}
exports.gradeProject = gradeProject;
//reduce overlap in code, easy
var Runners;
(function (Runners) {
    function multiIO(filename) {
        return (s) => new Future_1.Future((resolve, reject) => {
            let running = true;
            let py = process.spawn("python3", ['uploads/' + filename]);
            let output = List_1.List.apply([]);
            py.stdout.on('data', function (data) {
                var buff = new Buffer(data);
                output = output.add(buff.toString("utf8"));
            });
            py.stderr.on('data', function (err) {
                var buff = new Buffer(err);
                reject(buff.toString("utf8"));
            });
            py.on('close', function () {
                running = false;
                if (output.length() == 0)
                    reject("No output received!");
                else
                    resolve(output.map(s => s.replace(/\r?\n|\r/, "")));
            });
            List_1.List.forall(s, s => py.stdin.write(s));
            py.stdin.end();
            setTimeout(function () {
                if (running) {
                    py.kill();
                    reject("Max runtime of 10s exeeded!");
                }
            }, 10000);
        });
    }
    Runners.multiIO = multiIO;
    //one to collect /n/r in list, much easier to work with
    function simpleIO(filename) {
        return (s) => new Future_1.Future((resolve, reject) => {
            let running = true;
            let py = process.spawn("python3", ['uploads/' + filename]);
            let output;
            py.stdout.on('data', function (data) {
                var buff = new Buffer(data);
                output = buff.toString("utf8");
            });
            py.stderr.on('data', function (err) {
                var buff = new Buffer(err);
                reject(buff.toString("utf8"));
            });
            py.on('close', function () {
                running = false;
                if (!output)
                    resolve("");
                else
                    resolve(output);
            });
            py.stdin.write(s);
            py.stdin.end();
            setTimeout(function () {
                if (running) {
                    py.kill();
                    reject("Max runtime of 10s exeeded!");
                }
            }, 10000);
        });
    }
    Runners.simpleIO = simpleIO;
    function simpleIOFixline(filename) {
        return (s) => new Future_1.Future((resolve, reject) => {
            let running = true;
            let py = process.spawn("python3", ['uploads/' + filename]);
            let output;
            py.stdout.on('data', function (data) {
                var buff = new Buffer(data);
                output = buff.toString("utf8");
            });
            py.stderr.on('data', function (err) {
                var buff = new Buffer(err);
                reject(buff.toString("utf8"));
            });
            py.on('close', function () {
                running = false;
                if (!output)
                    reject("No output received!");
                else
                    resolve(output.replace(/\r?\n|\r/, ""));
            });
            py.stdin.write(s);
            py.stdin.end();
            setTimeout(function () {
                if (running) {
                    py.kill();
                    reject("Max runtime of 10s exeeded!");
                }
            }, 10000);
        });
    }
    Runners.simpleIOFixline = simpleIOFixline;
})(Runners = exports.Runners || (exports.Runners = {}));
//# sourceMappingURL=AutoGrader.js.map