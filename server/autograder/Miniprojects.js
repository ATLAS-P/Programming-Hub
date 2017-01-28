"use strict";
const AutoGrader_1 = require("./AutoGrader");
const Runners_1 = require("./Runners");
const List_1 = require("../functional/List");
const Tuple_1 = require("../functional/Tuple");
const IOMap_1 = require("../functional/IOMap");
var TestHelper;
(function (TestHelper) {
    TestHelper.init = IOMap_1.IOMap.applyWithInput;
    TestHelper.testIO = AutoGrader_1.AutoChecker.evaluateEither;
    TestHelper.testIOCurry = f => a => TestHelper.testIO(a, f);
    TestHelper.testData = AutoGrader_1.AutoChecker.evaluateEitherWith;
    TestHelper.testDataCurry = (data, f) => a => TestHelper.testData(a, data, f);
    function buildTest(data) {
        return IOMap_1.IOMap.traverse(data, s => TestHelper.init(s));
    }
    TestHelper.buildTest = buildTest;
    var Tests;
    (function (Tests) {
        Tests.inIsOut = a => TestHelper.testIO(a, (i, o) => new Tuple_1.Tuple(i == o, "Unexpected output, received: '" + o + "', expected: '" + i + "'."));
        Tests.expected = data => a => TestHelper.testData(a, data, (a, b) => new Tuple_1.Tuple(a == b, "Unexpected output, received: '" + a + "', expected: '" + b + "'."));
    })(Tests = TestHelper.Tests || (TestHelper.Tests = {}));
})(TestHelper = exports.TestHelper || (exports.TestHelper = {}));
var DataHelper;
(function (DataHelper) {
    function data(...a) {
        return List_1.List.apply(a);
    }
    DataHelper.data = data;
    function dataStr(...a) {
        return List_1.List.apply(a).map(a => a.toString());
    }
    DataHelper.dataStr = dataStr;
    function dataMap(f, ...a) {
        return List_1.List.apply(a).map(f);
    }
    DataHelper.dataMap = dataMap;
    //make something more modular, scalable
    function rndList(seed, size, ...a) {
        return rnd(Pools.list(a), seed, a.length, 0, size);
    }
    DataHelper.rndList = rndList;
    function rndInt(seed, size, min, max) {
        return rnd(Pools.ints, seed, max, min, size);
    }
    DataHelper.rndInt = rndInt;
    function rnd(pool, seed, max, min, size) {
        Random.setRandomSeed(seed);
        function populate(la = List_1.List.apply([])) {
            if (la.length() == size)
                return la;
            else
                return populate(la.add(pool(Random.randomInt(min, max))));
        }
        return populate();
    }
    DataHelper.rnd = rnd;
    var Random;
    (function (Random) {
        var SEED = 0;
        function setRandomSeed(seed) {
            SEED = Math.abs(seed);
        }
        Random.setRandomSeed = setRandomSeed;
        function random(min = 0, max = 1) {
            SEED = (SEED * 9301 + 49297) % 233280;
            const rnd = SEED / 233280;
            return min + rnd * (max - min);
        }
        Random.random = random;
        function randomInt(min, max) {
            return Math.floor(random(min, max));
        }
        Random.randomInt = randomInt;
    })(Random || (Random = {}));
    var Pools;
    (function (Pools) {
        function ints(a) {
            return a;
        }
        Pools.ints = ints;
        function intsEven(a) {
            return a * 2;
        }
        Pools.intsEven = intsEven;
        function intsOdd(a) {
            return intsEven(a) + 1;
        }
        Pools.intsOdd = intsOdd;
        function list(la) {
            return a => la[a];
        }
        Pools.list = list;
    })(Pools = DataHelper.Pools || (DataHelper.Pools = {}));
})(DataHelper = exports.DataHelper || (exports.DataHelper = {}));
/*
put below in sererate files
*/
//test map evaluation definitions
const optimalGuess = TestHelper.testIOCurry((i, o) => {
    if (o == -1)
        return new Tuple_1.Tuple(false, "Your AI was not able to guess the result within 500 guesses.");
    const bound = Math.ceil(Math.log2(i[0])) + 1;
    return new Tuple_1.Tuple(o <= bound, "Your result was not optimal. Your AI needed " + o + " tries. Optimal result should be less or equal to: " + bound + " tries.");
});
const greenBottles = TestHelper.testIOCurry(validateGreenBottles);
const stopwatch = TestHelper.testDataCurry(List_1.List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out, data) => {
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
const guessData = List_1.List.apply([[100, 45], [1, 1], [100, 100], [101, 100], [100, 1], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]]);
//why y no monoid
const stopwatchData = List_1.List.apply([
    List_1.List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
    List_1.List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple_1.Tuple(d[0], d[1])),
    List_1.List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple_1.Tuple(d[0], d[1]))
]);
//const randTest = (s1: number, s2: number, n: number) => DataHelper.rndList(s1, n, "t", "p", "l").addAll("l", "s").zip(DataHelper.rndInt(s2, n + 2, 25, 2500))
const rndStringTest = TestHelper.buildTest(randomStrings);
const lowIntsTest = TestHelper.buildTest(lowInts);
const stopWatchTest = TestHelper.buildTest(stopwatchData);
const guessTest = TestHelper.buildTest(guessData);
/*
put above in sererate files
*/
class Miniproject {
    constructor(runner, test, input) {
        this.runner = runner;
        this.test = test;
        this.input = input;
    }
}
exports.Miniproject = Miniproject;
var Miniprojects;
(function (Miniprojects) {
    const projects = {
        "io": new Miniproject(Runners_1.Runners.PythonRunners.simpleIO, TestHelper.Tests.inIsOut, rndStringTest),
        "n_green_bottles": new Miniproject(Runners_1.Runners.PythonRunners.simpleIO, greenBottles, lowIntsTest),
        "stopwatch": new Miniproject(Runners_1.Runners.PythonRunners.sleepIO, stopwatch, stopWatchTest),
        "guess_the_number_inversed": new Miniproject(Runners_1.Runners.PythonRunners.guessRunner, optimalGuess, guessTest),
    };
    function grade(r, algebra, test, success, error) {
        algebra(test).run(r).then(success, error);
    }
    Miniprojects.grade = grade;
    function gradeProject(project, filename, success, error) {
        const proj = projects[project];
        if (!proj)
            error("There does not exist a test for project with ID: " + project + "!");
        else
            grade(proj.runner(filename), proj.test, proj.input, success, error);
    }
    Miniprojects.gradeProject = gradeProject;
})(Miniprojects = exports.Miniprojects || (exports.Miniprojects = {}));
//# sourceMappingURL=Miniprojects.js.map