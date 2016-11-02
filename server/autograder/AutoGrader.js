"use strict";
const Future_1 = require("../functional/Future");
const Result_1 = require("./Result");
const List_1 = require("../functional/List");
const Tuple_1 = require("../functional/Tuple");
const IOMap_1 = require("../functional/IOMap");
const Either_1 = require("../functional/Either");
const Config_1 = require('../server/Config');
const process = require('child_process');
const BREAK = Config_1.Config.grader.break;
var AutoChecker;
(function (AutoChecker) {
    function foldLeft(a, f) {
        return IOMap_1.IOMap.ListHelper.foldLeft(a, (r, ltia) => r.addAll(f(ltia._1, ltia._2)), Result_1.Result.unit());
    }
    AutoChecker.foldLeft = foldLeft;
    function evaluate(a, f) {
        return foldLeft(a, (a, b) => f(a, b).map((result, message) => Result_1.Result.unit(Result_1.Test.unit(result, a, message))));
    }
    AutoChecker.evaluate = evaluate;
    function evaluateEither(a, f) {
        return foldLeft(a, (a, b) => {
            if (b.isLeft)
                return f(a, b.val).map((result, message) => Result_1.Result.unit(Result_1.Test.unit(result, a, message)));
            else
                return Result_1.Result.unit(Result_1.Test.unit(false, a, b.val));
        });
    }
    AutoChecker.evaluateEither = evaluateEither;
    function foldZip(a, data, f) {
        return IOMap_1.IOMap.ListHelper.foldZip(a, data, (r, ttiaa) => r.addAll(f(ttiaa._1, ttiaa._2)), Result_1.Result.unit());
    }
    AutoChecker.foldZip = foldZip;
    function evaluateWith(a, data, f) {
        return foldZip(a, data, (a, b) => f(a._2, b).map((res, mess) => Result_1.Result.unit(Result_1.Test.unit(res, a._1, mess))));
    }
    AutoChecker.evaluateWith = evaluateWith;
    function evaluateEitherWith(a, data, f) {
        return foldZip(a, data, (a, b) => {
            if (a._2.isLeft())
                return f(a._2.val, b).map((res, mess) => Result_1.Result.unit(Result_1.Test.unit(res, a._1, mess)));
            else
                return Result_1.Result.unit(Result_1.Test.unit(false, a._1, a._2.val));
        });
    }
    AutoChecker.evaluateEitherWith = evaluateEitherWith;
})(AutoChecker || (AutoChecker = {}));
var ioTest = AutoChecker.evaluateEither;
var dataTest = AutoChecker.evaluateEitherWith;
var init = IOMap_1.IOMap.applyWithInput;
//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => new Tuple_1.Tuple(i == o, "Unexpected output, received: '" + o + "', expected: '" + i + "'."));
const optimalGuess = a => ioTest(a, (i, o) => {
    const bound = Math.floor(Math.log2(i[0])) + 1;
    return new Tuple_1.Tuple(o <= bound, "Your result was not optimal. Your AI needed " + o + " tries. Optimal result was less than: " + bound + " tries.");
});
const expected = data => a => dataTest(a, data, (a, b) => new Tuple_1.Tuple(a == b, "Unexpected output, received: '" + a + "', expected: '" + b + "'."));
const expectedF = (data, f) => a => dataTest(a, data, (a, b) => f(a, b));
const greenBottles = a => ioTest(a, validateGreenBottles);
const stopwatch = expectedF(List_1.List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out, data) => {
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
function numInRange(x, low, high) {
    return low <= x && x <= high;
}
function getFirstNumber(s, z) {
    const reg = /^\D*(\d+(?:\.\d+)?)/g;
    const match = reg.exec(s);
    if (!match)
        return z;
    else
        return Number(match[1]);
}
function validateGreenBottles(n, out) {
    const input = parseInt(n);
    const build = (n, acc = "") => {
        const bottleName = (a) => a > 1 ? "bottles" : "bottle";
        const mss = n + " green " + bottleName(n) + " hanging on the wall";
        const acc2 = acc + mss + mss + "and if one green bottle should accidentally fall";
        if (n - 1 == 0)
            return acc2 + "there'll be no green bottles hanging on the wall";
        else
            return build(n - 1, acc2 + "there'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall");
    };
    const builded = build(input);
    const comp = strDiff(builded, out.toLowerCase());
    if (comp == -1)
        return new Tuple_1.Tuple(true, "");
    else {
        return new Tuple_1.Tuple(false, "Unexpected output, found '" + found(out, comp) + "', expected: '" + found(builded, comp) + "'. This is case insensitive.");
    }
}
function found(str, at) {
    if (at < 10)
        return str.substring(0, at) + str.charAt(at);
    else
        return str.substring(at - 9, at) + str.charAt(at);
}
//-1 if eq, else first uneq char
function strDiff(str1, str2) {
    function checkAt(n = 0) {
        if (n == str1.length && n == str2.length)
            return -1;
        else if (n == str1.length || n == str2.length)
            return n;
        else {
            if (str1.charAt(n) != str2.charAt(n))
                return n;
            else
                return checkAt(n + 1);
        }
    }
    return checkAt();
}
//test input definitions
const randomStrings = List_1.List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"]);
const lowInts = List_1.List.apply([1, 2, 5]).map(i => i.toString());
const guessData = List_1.List.apply([[100, 45], [1, 1], [1, 0], [100, 100], [101, 100], [100, 1], [100, 0], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]]);
//why y no monoid
const stopwatchData = List_1.List.apply([
    List_1.List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
    List_1.List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
    List_1.List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple_1.Tuple(d[0], d[1]))
]);
const rndStringTest = IOMap_1.IOMap.traverse(randomStrings, s => init(s));
const lowIntsTest = IOMap_1.IOMap.traverse(lowInts, s => init(s));
const stopWatchTest = IOMap_1.IOMap.traverse(stopwatchData, s => init(s));
const guessTest = IOMap_1.IOMap.traverse(guessData, s => init(s));
//generic grading function
function grade(r, algebra, test, success, error) {
    algebra(test).run(r).then(success, error).catch((reason) => console.log(reason));
}
function gradeProject(project, filename, success, error) {
    switch (project) {
        case "io":
            grade(Runners.PythonRunners.simpleIO(filename), inIsOut, rndStringTest, success, error);
            break;
        case "n_green_bottles":
            grade(Runners.PythonRunners.simpleIO(filename), greenBottles, lowIntsTest, success, error);
            break;
        case "stopwatch":
            grade(Runners.PythonRunners.sleepIO(filename), stopwatch, stopWatchTest, success, error);
            break;
        case "guess_the_number_inversed":
            //use expectedF to specify upper bound manually, use, some less some more strict some optimal, can put in input
            grade(Runners.PythonRunners.guessRunner(filename), optimalGuess, guessTest, success, error);
            break;
        default:
            error("There does not exist a test for project with ID: " + project + "!");
            break;
    }
}
exports.gradeProject = gradeProject;
//reduce overlap in code, easy
var Runners;
(function (Runners) {
    function pythonSpawner(z, onData, putInput, finalizeOutput = ((a) => a)) {
        return (filename) => (s) => new Future_1.Future((resolve, reject) => {
            let running = true;
            let py = process.spawn("python3", ['uploads/' + filename]);
            let output = z;
            py.stdout.on('data', function (data) {
                var buff = new Buffer(data);
                output = onData(output, buff.toString("utf8"), py.stdin);
            });
            py.stderr.on('data', function (err) {
                running = false;
                var buff = new Buffer(err);
                resolve(new Either_1.Right(buff.toString("utf8")));
            });
            py.on('close', function () {
                running = false;
                if (!output)
                    resolve(new Either_1.Right("No output received!"));
                else
                    resolve(new Either_1.Left(finalizeOutput(output)));
            });
            function isRunning() {
                return running;
            }
            const inDone = putInput(py.stdin, s, isRunning);
            if (inDone)
                output = inDone;
            setTimeout(function () {
                if (running) {
                    running = false;
                    py.kill();
                    resolve(new Either_1.Right("Max runtime of 5s exeeded!"));
                }
            }, 5000);
        });
    }
    function simpleIn(stdin, inn, running) {
        stdin.write(inn);
        stdin.end();
    }
    function listIn(stdin, inn, running) {
        List_1.List.forall(inn, s => stdin.write(s));
        stdin.end();
    }
    var PythonRunners;
    (function (PythonRunners) {
        PythonRunners.multiIO = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/g, ""));
        }, listIn);
        PythonRunners.simpleIO = pythonSpawner("", (out, data, stdin) => {
            return out + data.replace(/\r?\n|\r/g, "");
        }, simpleIn);
        //NOTE output might need to be reversed, so List.apply ..... append out, also create a multiIOasList
        PythonRunners.simpleIOasList = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.append(List_1.List.apply(data.split(/\r?\n|\r/)));
        }, simpleIn);
        PythonRunners.guessRunner = pythonSpawner(new Tuple_1.Tuple(0, 0), (out, data, stdin) => {
            const guess = getFirstNumber(data, -1);
            if (guess > out._1)
                stdin.write("h" + BREAK);
            else if (guess < out._1)
                stdin.write("l" + BREAK);
            else {
                stdin.write("c" + BREAK);
                stdin.end();
            }
            return out.map_2(a => a + 1);
        }, (stdin, inn, running) => {
            stdin.write(inn[0] + BREAK);
            return new Tuple_1.Tuple(inn[1], 0);
        }, a => a._2);
        PythonRunners.sleepIO = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/, ""));
        }, (stdin, inn, running) => {
            function slowAll(s) {
                if (s.length() == 0)
                    stdin.end();
                else {
                    const tup = s.head(new Tuple_1.Tuple("", 0));
                    setTimeout(() => {
                        if (running() && stdin.writable) {
                            stdin.write(tup._1 + BREAK);
                            slowAll(s.tail());
                        }
                    }, tup._2);
                }
            }
            slowAll(inn);
        });
    })(PythonRunners = Runners.PythonRunners || (Runners.PythonRunners = {}));
})(Runners = exports.Runners || (exports.Runners = {}));
//# sourceMappingURL=AutoGrader.js.map